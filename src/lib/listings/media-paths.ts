// Storage path helpers and variant configuration for listing media.
// Path convention (both buckets): `listings/{listing_id}/...`
// so storage RLS can derive the listing id from `(storage.foldername(name))[2]`.

export const IMAGES_BUCKET = "listing-images";
export const ORIGINALS_BUCKET = "listing-originals";
export const DOCUMENTS_BUCKET = "listing-documents";

export type ImageVariant = "thumb" | "medium" | "large" | "og";
export type VariantFormat = "avif" | "webp";

export interface VariantSpec {
  key: ImageVariant;
  width: number;
  height?: number; // only set when the crop is fixed (og)
  crop?: "center";
}

export const VARIANT_SPECS: VariantSpec[] = [
  { key: "thumb", width: 400 },
  { key: "medium", width: 1200 },
  { key: "large", width: 1200 },
  { key: "og", width: 1200, height: 630, crop: "center" },
];

export const VARIANT_FORMATS: VariantFormat[] = ["webp", "avif"];

// Storage paths ------------------------------------------------------------

export function originalPath(listingId: string, imageId: string, ext: string) {
  return `listings/${listingId}/originals/${imageId}.${normalizeExt(ext)}`;
}

export function variantPath(
  listingId: string,
  imageId: string,
  variant: ImageVariant,
  format: VariantFormat,
) {
  return `listings/${listingId}/${imageId}/${variant}.${format}`;
}

export function imageFolderPrefix(listingId: string, imageId: string) {
  return `listings/${listingId}/${imageId}/`;
}

export function documentPath(listingId: string, docId: string, ext: string) {
  return `listings/${listingId}/documents/${docId}.${normalizeExt(ext)}`;
}

function normalizeExt(ext: string): string {
  const clean = ext.replace(/^\./, "").toLowerCase();
  return clean || "bin";
}

// Shape stored in listing_images.variants
export type VariantsJson = Partial<
  Record<ImageVariant, Partial<Record<VariantFormat, { path: string; width: number; height: number; bytes: number }>>>
>;
