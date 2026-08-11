// Supabase Edge Function: process-listing-image
// Trigger: invoked by src/lib/listings/media.functions.ts#enqueueImageProcessing
// after the client has uploaded the original into the `listing-documents`
// bucket. Runs asynchronously via EdgeRuntime.waitUntil so the caller sees
// an immediate 202 while the pixel work continues in the background.
//
// Guarantees:
//   - EXIF (including GPS) is never written to any output: we decode to raw
//     RGBA, rotate per Orientation tag, then re-encode.
//   - No upscaling: variants smaller than the target width use the original
//     dimensions.
//   - Failures are recorded on the DB row (processing_status='failed',
//     processing_error) so the UI never sees a silent half-finished state.
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import {
  applyOrientation,
  computeBlurhash,
  coverCrop,
  decodeImage,
  readOrientation,
  resizeMax,
  toAvif,
  toWebp,
  type PixelBuffer,
} from "./pipeline.ts";

// Path helpers duplicated from src/lib/listings/media-paths.ts. Keep in sync.
const IMAGES_BUCKET = "listing-images";
const ORIGINALS_BUCKET = "listing-originals";
type Variant = "thumb" | "medium" | "large" | "og";
type Fmt = "avif" | "webp";
const SPECS: { key: Variant; width: number; height?: number; crop?: "center" }[] = [
  { key: "thumb", width: 400 },
  { key: "medium", width: 1200 },
  { key: "large", width: 2400 },
  { key: "og", width: 1200, height: 630, crop: "center" },
];
const FORMATS: Fmt[] = ["avif", "webp"];
const variantPath = (l: string, i: string, v: Variant, f: Fmt) =>
  `listings/${l}/${i}/${v}.${f}`;

interface Payload {
  listingId: string;
  imageId: string;
  originalStoragePath: string;
  contentType: string;
}

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const EDGE_SECRET = Deno.env.get("EDGE_FUNCTION_SECRET") ?? "";

// Constant-time string compare. Returns false on any length mismatch or
// character mismatch without an early exit.
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.byteLength !== bb.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < ab.byteLength; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Shared-secret gate. Reject BEFORE parsing or touching the database.
  const provided = req.headers.get("x-edge-secret") ?? "";
  if (!EDGE_SECRET || !timingSafeEqual(provided, EDGE_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!payload?.listingId || !payload?.imageId || !payload?.originalStoragePath) {
    return new Response("Missing fields", { status: 400 });
  }

  // Defence in depth: even if the secret leaks, the row identified by
  // imageId must already reference this listing and this original path.
  // This prevents cross-listing writes from a stolen secret.
  const { data: row, error: rowErr } = await admin
    .from("listing_images")
    .select("id, listing_id, original_storage_path")
    .eq("id", payload.imageId)
    .maybeSingle();
  if (rowErr) return new Response(rowErr.message, { status: 500 });
  if (!row) return new Response("Image row not found", { status: 404 });
  if (row.listing_id !== payload.listingId) {
    return new Response("Listing mismatch", { status: 403 });
  }
  if (row.original_storage_path !== payload.originalStoragePath) {
    return new Response("Original path mismatch", { status: 403 });
  }

  // Kick off async work; respond immediately.
  // deno-lint-ignore no-explicit-any
  const rt = (globalThis as any).EdgeRuntime;
  const task = processImage(payload).catch((err) => recordFailure(payload.imageId, err));
  if (rt?.waitUntil) rt.waitUntil(task); else await task;

  return new Response(JSON.stringify({ status: "processing" }), {
    status: 202,
    headers: { "content-type": "application/json" },
  });
});

async function processImage(p: Payload) {
  await admin
    .from("listing_images")
    .update({ processing_status: "processing", processing_error: null })
    .eq("id", p.imageId);

  // 1. Download original from the private documents bucket.
  const { data: blob, error: dlError } = await admin.storage
    .from(ORIGINALS_BUCKET)
    .download(p.originalStoragePath);
  if (dlError || !blob) throw new Error(`download failed: ${dlError?.message}`);
  const bytes = new Uint8Array(await blob.arrayBuffer());

  // 2. Orient + decode to raw RGBA (EXIF stripped by re-encoding downstream).
  const orientation = await readOrientation(bytes, p.contentType);
  let working: PixelBuffer | null = applyOrientation(
    await decodeImage(bytes, p.contentType),
    orientation,
  );
  const sourceWidth = working.width;
  const sourceHeight = working.height;

  // 3. Emit every variant × format as a CASCADE, largest first: each frame is
  // derived from the previous (already smaller) one and the bigger buffer is
  // dropped immediately. Re-framing every variant from the full-resolution
  // buffer keeps ~30 MB of RGBA alive next to the WASM encoder heaps and blows
  // the edge function's memory limit on ordinary phone photos.
  const variants: Record<string, Record<string, { path: string; width: number; height: number; bytes: number }>> = {};
  // blurhash comes off a tiny preview taken while the full buffer is still here.
  console.log(`stage decoded ${working.width}x${working.height}`);
  const blurhash = await computeBlurhash(working);
  console.log("stage blurhash done");


  const cascade = [...SPECS]
    .filter((s) => s.crop !== "center")
    .sort((a, b) => b.width - a.width);
  const ogSpec = SPECS.find((s) => s.crop === "center" && s.height);

  let ogSource: PixelBuffer | null = null;
  for (const spec of cascade) {
    const framed: PixelBuffer = await resizeMax(working!, spec.width);
    working = framed; // previous, larger buffer is now unreachable
    if (ogSpec && spec.width >= ogSpec.width) ogSource = framed;
    await encodeAndUpload(p, spec.key, framed, variants);
  }

  // og is centre-cropped from the smallest cascade frame that still covers it.
  if (ogSpec?.height) {
    const framed = await coverCrop(ogSource ?? working!, ogSpec.width, ogSpec.height);
    ogSource = null;
    working = null;
    await encodeAndUpload(p, ogSpec.key, framed, variants);
  }
  working = null;

  // 4. Primary storage_path points at the medium AVIF as canonical.
  const primary = variants.medium?.avif?.path ?? variants.large?.avif?.path ?? "";

  const { error: updError } = await admin
    .from("listing_images")
    .update({
      variants,
      blurhash,
      width: sourceWidth,
      height: sourceHeight,
      storage_path: primary,
      processing_status: "done",
      processing_error: null,
    })
    .eq("id", p.imageId);
  if (updError) throw new Error(`row update failed: ${updError.message}`);
}

/** Encode one frame to every output format, upload it, record the variant. */
async function encodeAndUpload(
  p: Payload,
  key: Variant,
  framed: PixelBuffer,
  variants: Record<string, Record<string, { path: string; width: number; height: number; bytes: number }>>,
) {
  for (const fmt of FORMATS) {
    console.log(`stage encode ${key}/${fmt} ${framed.width}x${framed.height}`);
    const encoded = fmt === "avif" ? await toAvif(framed) : await toWebp(framed);

    const path = variantPath(p.listingId, p.imageId, key, fmt);
    const { error: upErr } = await admin.storage
      .from(IMAGES_BUCKET)
      .upload(path, encoded, {
        contentType: fmt === "avif" ? "image/avif" : "image/webp",
        upsert: true,
      });
    if (upErr) throw new Error(`upload ${key}/${fmt} failed: ${upErr.message}`);
    (variants[key] ??= {})[fmt] = {
      path,
      width: framed.width,
      height: framed.height,
      bytes: encoded.byteLength,
    };
  }
}


async function recordFailure(imageId: string, err: unknown) {
  const message = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  console.error("image processing failed", imageId, message);
  await admin
    .from("listing_images")
    .update({ processing_status: "failed", processing_error: message.slice(0, 500) })
    .eq("id", imageId);
}

