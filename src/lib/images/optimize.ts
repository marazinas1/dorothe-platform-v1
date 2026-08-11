// Browser-side image optimisation. Everything happens on the client:
// decode (with EXIF orientation applied), resize, encode to WebP with an
// iterative quality ladder, and compute a blurhash. A canvas re-encode
// carries no metadata, so EXIF/GPS are stripped for free.
//
// Browser-only module: never import it into SSR-rendered code paths at
// module scope of a server function.
import { encode as encodeBlurhash } from "blurhash";

import {
  QUALITY_STEPS,
  VARIANT_SPECS,
  type ImageVariant,
  type VariantSpec,
} from "@/lib/listings/media-paths";

export interface EncodedVariant {
  key: ImageVariant;
  blob: Blob;
  width: number;
  height: number;
}

export interface ProcessedImage {
  variants: EncodedVariant[];
  blurhash: string;
  /** Intrinsic size of the source photo after orientation is applied. */
  width: number;
  height: number;
}

/** Decode a file, honouring EXIF orientation from phone cameras. */
async function decode(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

function makeCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

async function toWebp(canvas: AnyCanvas, quality: number): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/webp", quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("WebP encoding failed"))),
      "image/webp",
      quality,
    );
  });
}

/**
 * Draw the bitmap into the target box. Fixed-height specs (og) are
 * centre-cropped; the rest keep aspect ratio. Never upscales: a photo
 * smaller than the target passes through at its own size.
 */
function drawFor(bitmap: ImageBitmap, spec: VariantSpec) {
  if (spec.height) {
    const targetW = Math.min(spec.width, bitmap.width);
    const targetH = Math.min(
      spec.height,
      Math.round((targetW * spec.height) / spec.width),
    );
    const scale = Math.max(targetW / bitmap.width, targetH / bitmap.height);
    const sw = Math.min(bitmap.width, Math.round(targetW / scale));
    const sh = Math.min(bitmap.height, Math.round(targetH / scale));
    const sx = Math.floor((bitmap.width - sw) / 2);
    const sy = Math.floor((bitmap.height - sh) / 2);
    const canvas = makeCanvas(targetW, targetH);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetW, targetH);
    return { canvas, width: targetW, height: targetH };
  }

  const width = Math.min(spec.width, bitmap.width);
  const height = Math.max(1, Math.round((bitmap.height * width) / bitmap.width));
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return { canvas, width, height };
}

/** Encode at the best quality that fits the size budget. */
async function encodeWithinBudget(canvas: AnyCanvas, maxBytes: number): Promise<Blob> {
  let last: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    const blob = await toWebp(canvas, quality);
    last = blob;
    if (blob.size <= maxBytes) return blob;
  }
  // Nothing fit the budget; the lowest-quality attempt is the best we have.
  if (!last) throw new Error("WebP encoding failed");
  return last;
}

async function blurhashOf(bitmap: ImageBitmap): Promise<string> {
  const width = Math.min(64, bitmap.width);
  const height = Math.max(1, Math.round((bitmap.height * width) / bitmap.width));
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  return encodeBlurhash(new Uint8ClampedArray(data), width, height, 4, 3);
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const bitmap = await decode(file);
  try {
    const variants: EncodedVariant[] = [];
    for (const spec of VARIANT_SPECS) {
      const { canvas, width, height } = drawFor(bitmap, spec);
      const blob = await encodeWithinBudget(canvas, spec.maxBytes);
      variants.push({ key: spec.key, blob, width, height });
    }
    return {
      variants,
      blurhash: await blurhashOf(bitmap),
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    bitmap.close?.();
  }
}
