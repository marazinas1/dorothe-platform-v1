// Admin-side helper for reading a processed variant URL out of
// listing_images.variants. The browser pipeline stores absolute public URLs
// (the listing-images bucket is public; originals never are).
import { pickImageUrl } from "@/lib/listings/image";
import type { ImageVariant } from "@/lib/listings/media-paths";

export function variantUrl(variants: unknown, size: ImageVariant = "card"): string | null {
  return pickImageUrl(variants, size);
}

export function fileExtension(name: string, contentType: string): string {
  const fromName = name.includes(".") ? name.split(".").pop() ?? "" : "";
  if (fromName) return fromName.toLowerCase();
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  return "jpg";
}
