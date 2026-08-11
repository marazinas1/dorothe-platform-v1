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
  { key: "large", width: 1200 },
  { key: "og", width: 1200, height: 630, crop: "center" },
];
// AVIF runs last so its large persistent WASM heap cannot starve WebP.
const FORMATS: Fmt[] = ["webp", "avif"];
const variantPath = (l: string, i: string, v: Variant, f: Fmt) =>
  `listings/${l}/${i}/${v}.${f}`;

interface Payload {
  listingId: string;
  imageId: string;
  originalStoragePath: string;
  contentType: string;
  variant: Variant;
  format: Fmt;
  final: boolean;
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
    console.warn("request rejected: authentication");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (!payload?.listingId || !payload?.imageId || !payload?.originalStoragePath ||
      !SPECS.some((s) => s.key === payload.variant) || !FORMATS.includes(payload.format)) {
    console.warn("request rejected: payload", {
      hasListingId: Boolean(payload?.listingId),
      hasImageId: Boolean(payload?.imageId),
      hasOriginalPath: Boolean(payload?.originalStoragePath),
      variant: payload?.variant,
      format: payload?.format,
    });
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
  if (rowErr) { console.error("request rejected: row read", rowErr.message); return new Response(rowErr.message, { status: 500 }); }
  if (!row) { console.warn("request rejected: row missing"); return new Response("Image row not found", { status: 404 }); }
  if (row.listing_id !== payload.listingId) {
    console.warn("request rejected: listing mismatch");
    return new Response("Listing mismatch", { status: 403 });
  }
  if (row.original_storage_path !== payload.originalStoragePath) {
    console.warn("request rejected: path mismatch");
    return new Response("Original path mismatch", { status: 403 });
  }

  try {
    await processImage(payload);
    return Response.json({ status: payload.final ? "done" : "processing" });
  } catch (err) {
    await recordFailure(payload.imageId, err);
    return new Response("Image processing failed", { status: 500 });
  }
});

async function processImage(p: Payload) {
  await admin
    .from("listing_images")
    .update({
      processing_status: "processing",
      processing_error: null,
      processing_started_at: new Date().toISOString(),
    })
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

  // One invocation emits exactly one variant/format. Isolating codec heaps is
  // required by the edge memory ceiling; the caller runs the jobs sequentially.
  console.log(`stage decoded ${working.width}x${working.height}`);
  const spec = SPECS.find((candidate) => candidate.key === p.variant);
  if (!spec) throw new Error(`Unknown variant: ${p.variant}`);
  const blurhash = p.variant === "thumb" && p.format === "webp"
    ? await computeBlurhash(working)
    : null;
  const framed = spec.crop === "center" && spec.height
    ? await coverCrop(working, spec.width, spec.height)
    : await resizeMax(working, spec.width);
  working = null;
  const variant = await encodeAndUpload(p, spec.key, p.format, framed);

  const { data: current, error: currentError } = await admin
    .from("listing_images")
    .select("variants, blurhash")
    .eq("id", p.imageId)
    .single();
  if (currentError) throw new Error(`row read failed: ${currentError.message}`);
  const variants = (current.variants ?? {}) as Record<string, Record<string, unknown>>;
  (variants[p.variant] ??= {})[p.format] = variant;

  // 4. Primary storage_path points at the medium AVIF as canonical.
  const primary = p.final ? variantPath(p.listingId, p.imageId, "medium", "avif") : "";

  const { error: updError } = await admin
    .from("listing_images")
    .update({
      variants,
      blurhash: blurhash ?? current.blurhash,
      width: sourceWidth,
      height: sourceHeight,
      ...(p.final ? { storage_path: primary } : {}),
      processing_status: p.final ? "done" : "processing",
      processing_error: null,
      processing_started_at: p.final ? null : new Date().toISOString(),
    })
    .eq("id", p.imageId);
  if (updError) throw new Error(`row update failed: ${updError.message}`);
}

/** Encode one frame to every output format, upload it, record the variant. */
async function encodeAndUpload(
  p: Payload,
  key: Variant,
  fmt: Fmt,
  framed: PixelBuffer,
) {
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
  return { path, width: framed.width, height: framed.height, bytes: encoded.byteLength };
}


async function recordFailure(imageId: string, err: unknown) {
  const message = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  console.error("image processing failed", imageId, message);
  await admin
    .from("listing_images")
    .update({
      processing_status: "failed",
      processing_error: message.slice(0, 500),
      processing_started_at: null,
    })
    .eq("id", imageId);
}

