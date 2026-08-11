// Storage path helpers and variant configuration for listing media.
// Path convention (both buckets): `listings/{listing_id}/...`
// so storage RLS can derive the listing id from `(storage.foldername(name))[2]`.
//
// Variants are produced in the BROWSER (see src/lib/images/optimize.ts) and
// uploaded directly: WebP only, three sizes, no server-side encoding.

export const IMAGES_BUCKET = "listing-images";
export const ORIGINALS_BUCKET = "listing-originals";
export const DOCUMENTS_BUCKET = "listing-documents";

/** card = grids and cards, detail = detail page / lightbox, og = social preview. */
export type ImageVariant = "card" | "detail" | "og";

export interface VariantSpec {
  key: ImageVariant;
  width: number;
  /** Only set when the crop is fixed (og). */
  height?: number;
  /** Best-quality-that-fits budget, in bytes. */
  maxBytes: number;
}

export const VARIANT_SPECS: VariantSpec[] = [
  { key: "card", width: 800, maxBytes: 200_000 },
  { key: "detail", width: 1600, maxBytes: 400_000 },
  { key: "og", width: 1200, height: 630, maxBytes: 200_000 },
];

/** Quality ladder: first encode under the budget wins. */
export const QUALITY_STEPS = [0.8, 0.75, 0.7, 0.65, 0.55] as const;

export const VARIANT_EXT = "webp";

// Storage paths ------------------------------------------------------------

export function originalPath(listingId: string, imageId: string, ext: string) {
  return `listings/${listingId}/originals/${imageId}.${normalizeExt(ext)}`;
}

export function variantPath(listingId: string, imageId: string, variant: ImageVariant) {
  return `listings/${listingId}/${imageId}/${variant}.${VARIANT_EXT}`;
}

export function imageFolderPrefix(listingId: string, imageId: string) {
  return `listings/${listingId}/${imageId}/`;
}

export function documentPath(listingId: string, docId: string, ext: string) {
  return `listings/${listingId}/documents/${docId}.${normalizeExt(ext)}`;
}

/** Absolute public URL for a bucket-relative path in the public images bucket. */
export function publicImageUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${IMAGES_BUCKET}/${path}`;
}

function normalizeExt(ext: string): string {
  const clean = ext.replace(/^\./, "").toLowerCase();
  return clean || "bin";
}

export interface VariantEntry {
  path: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
}

/** Shape stored in listing_images.variants */
export type VariantsJson = Partial<Record<ImageVariant, VariantEntry>>;
