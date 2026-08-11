// Pure image processing helpers for process-listing-image.
// Runs in Supabase Edge Runtime (Deno). Uses jsquash WASM codecs so no
// native binaries are required. EXIF is stripped implicitly (we decode to
// raw RGBA and re-encode), and orientation is corrected before that.
//
// Every variant is an EXIF-free re-encode of the rotated pixel buffer, so
// GPS coordinates from phone cameras cannot leak into any output.
import decodeJpeg, { init as initJpegDecode } from "https://esm.sh/@jsquash/jpeg@1.6.0/decode?target=deno";
import decodePng, { init as initPngDecode } from "https://esm.sh/@jsquash/png@3.1.1/decode?target=deno";
import decodeWebpJs, { init as initWebpDecode } from "https://esm.sh/@jsquash/webp@1.5.0/decode?target=deno";
// AVIF: import the SINGLE-THREADED emscripten codec directly. @jsquash/avif's
// own `encode` entry runs wasm-feature-detect and loads `avif_enc_mt` whenever
// threads look available; the Supabase edge runtime passes that detection but
// refuses the actual allocation with "Creating a shared memory is not
// supported". Bypassing the wrapper means no SharedArrayBuffer is ever
// requested. Do not switch back to "@jsquash/avif/encode".
import avifEncInit from "https://esm.sh/@jsquash/avif@2.1.1/codec/enc/avif_enc.mjs?target=deno";

import encodeWebp, { init as initWebpEncode } from "https://esm.sh/@jsquash/webp@1.5.0/encode?target=deno";
import resize, { initResize } from "https://esm.sh/@jsquash/resize@2.1.1?target=deno";
import { encode as encodeBlurhash } from "https://esm.sh/blurhash@2.0.5?target=deno";
import exifr from "https://esm.sh/exifr@7.1.3?target=deno";

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

let initialised = false;
async function ensureInit() {
  if (initialised) return;
  await Promise.all([
    initJpegDecode?.(),
    initPngDecode?.(),
    initWebpDecode?.(),
    initWebpEncode?.(),
    initResize?.(),
  ]);
  initialised = true;
}

// AVIF encoder options mirror @jsquash/avif's defaults; we own them now that
// the wrapper is bypassed.
const AVIF_OPTS = {
  quality: 55,
  qualityAlpha: -1,
  denoiseLevel: 0,
  tileColsLog2: 0,
  tileRowsLog2: 0,
  speed: 6,
  subsample: 1,
  chromaDeltaQ: false,
  sharpness: 0,
  tune: 0,
  enableSharpYUV: false,
  bitDepth: 8,
  lossless: false,
};

interface AvifEncoder {
  encode: (
    data: Uint8Array,
    width: number,
    height: number,
    opts: typeof AVIF_OPTS,
  ) => Uint8Array | null;
}

let avifEncoder: Promise<AvifEncoder> | undefined;
function getAvifEncoder(): Promise<AvifEncoder> {
  // deno-lint-ignore no-explicit-any
  avifEncoder ??= (avifEncInit as any)({ noInitialRun: true }) as Promise<AvifEncoder>;
  return avifEncoder;
}


export async function decodeImage(bytes: Uint8Array, contentType: string): Promise<PixelBuffer> {
  await ensureInit();
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const type = contentType.toLowerCase();
  let img: ImageData;
  if (type.includes("jpeg") || type.includes("jpg")) {
    img = (await decodeJpeg(buf)) as unknown as ImageData;
  } else if (type.includes("png")) {
    img = (await decodePng(buf)) as unknown as ImageData;
  } else if (type.includes("webp")) {
    img = (await decodeWebpJs(buf)) as unknown as ImageData;
  } else {
    throw new Error(`Unsupported image content-type: ${contentType}`);
  }
  return { data: new Uint8ClampedArray(img.data), width: img.width, height: img.height };
}

// Read EXIF orientation from a JPEG buffer; returns 1 when absent/unreadable.
export async function readOrientation(bytes: Uint8Array, contentType: string): Promise<number> {
  if (!contentType.toLowerCase().includes("jpeg") && !contentType.toLowerCase().includes("jpg")) {
    return 1;
  }
  try {
    const meta = await exifr.parse(bytes, { pick: ["Orientation"] });
    const o = meta?.Orientation;
    return typeof o === "number" && o >= 1 && o <= 8 ? o : 1;
  } catch {
    return 1;
  }
}

// Apply EXIF orientation to a raw RGBA buffer. Handles the four rotations
// and horizontal/vertical mirrors. Transpose/transverse (5, 7) are treated
// as their rotation equivalents; they are extremely rare in phone output.
export function applyOrientation(pix: PixelBuffer, orientation: number): PixelBuffer {
  switch (orientation) {
    case 1: return pix;
    case 2: return flip(pix, "h");
    case 3: return rotate180(pix);
    case 4: return flip(pix, "v");
    case 5: return rotate90(flip(pix, "h"));
    case 6: return rotate90(pix);
    case 7: return rotate90(flip(pix, "v"));
    case 8: return rotate270(pix);
    default: return pix;
  }
}

function flip({ data, width, height }: PixelBuffer, axis: "h" | "v"): PixelBuffer {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = axis === "h" ? width - 1 - x : x;
      const sy = axis === "v" ? height - 1 - y : y;
      const si = (sy * width + sx) * 4;
      const di = (y * width + x) * 4;
      out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
    }
  }
  return { data: out, width, height };
}
function rotate180(p: PixelBuffer): PixelBuffer { return flip(flip(p, "h"), "v"); }
function rotate90({ data, width, height }: PixelBuffer): PixelBuffer {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const si = (y * width + x) * 4;
    const di = (x * height + (height - 1 - y)) * 4;
    out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2]; out[di + 3] = data[si + 3];
  }
  return { data: out, width: height, height: width };
}
function rotate270(p: PixelBuffer): PixelBuffer { return rotate90(rotate90(rotate90(p))); }

// Resize preserving aspect ratio, never upscaling.
export async function resizeMax(pix: PixelBuffer, targetWidth: number): Promise<PixelBuffer> {
  if (pix.width <= targetWidth) return pix;
  const newH = Math.max(1, Math.round((pix.height * targetWidth) / pix.width));
  const out = await resize(
    new ImageData(pix.data, pix.width, pix.height),
    { width: targetWidth, height: newH, fitMethod: "stretch" },
  );
  return { data: new Uint8ClampedArray(out.data), width: out.width, height: out.height };
}

// Center-crop to exact dimensions, resizing first so both target dims fit.
export async function coverCrop(pix: PixelBuffer, w: number, h: number): Promise<PixelBuffer> {
  const scale = Math.max(w / pix.width, h / pix.height);
  const scaled = await (async () => {
    if (scale >= 1) return pix; // never upscale — fall through to pad-less crop of original
    const nw = Math.max(w, Math.round(pix.width * scale));
    const nh = Math.max(h, Math.round(pix.height * scale));
    const out = await resize(
      new ImageData(pix.data, pix.width, pix.height),
      { width: nw, height: nh, fitMethod: "stretch" },
    );
    return { data: new Uint8ClampedArray(out.data), width: out.width, height: out.height };
  })();
  const cw = Math.min(w, scaled.width);
  const ch = Math.min(h, scaled.height);
  const sx = Math.floor((scaled.width - cw) / 2);
  const sy = Math.floor((scaled.height - ch) / 2);
  const cropped = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const srcStart = ((sy + y) * scaled.width + sx) * 4;
    cropped.set(scaled.data.subarray(srcStart, srcStart + cw * 4), y * cw * 4);
  }
  return { data: cropped, width: cw, height: ch };
}

export async function toAvif(pix: PixelBuffer): Promise<Uint8Array> {
  const enc = await getAvifEncoder();
  const out = enc.encode(new Uint8Array(pix.data.buffer, pix.data.byteOffset, pix.data.byteLength), pix.width, pix.height, AVIF_OPTS);
  if (!out) throw new Error("AVIF encoding failed");
  return new Uint8Array(out);
}

export async function toWebp(pix: PixelBuffer): Promise<Uint8Array> {
  await ensureInit();
  const buf = await encodeWebp(new ImageData(pix.data, pix.width, pix.height), { quality: 78 });
  return new Uint8Array(buf);
}

// blurhash from a small preview; downscale first for speed.
export async function computeBlurhash(pix: PixelBuffer): Promise<string> {
  const small = await resizeMax(pix, 64);
  return encodeBlurhash(small.data, small.width, small.height, 4, 3);
}
