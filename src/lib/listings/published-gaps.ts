// Quality gaps on a listing that is already public. These are NOT publish
// blockers (the database let the listing go live) — they are things a visitor
// notices: no description, no map pin, thin photo set, no reference to quote.
//
// The rule lives here once. The dashboard evaluates it in TypeScript over a
// bounded candidate set, so it can never drift from a second SQL copy.
import type { Json } from "@/lib/inquiries/types";

export const PUBLISHED_GAP_KEYS = [
  "description",
  "map",
  "photos",
  "reference",
] as const;

export type PublishedGapKey = (typeof PUBLISHED_GAP_KEYS)[number];

/** Form anchor each gap deep-links to. */
export const GAP_ANCHOR: Record<PublishedGapKey, string> = {
  description: "texts",
  map: "map",
  photos: "photos",
  reference: "reference_code",
};

/** Below this a public listing looks unfinished, not merely brief. */
export const MIN_PUBLIC_PHOTOS = 5;

export type PublishedGapRow = {
  description: Json;
  geo_lat: number | string | null;
  geo_lng: number | string | null;
  reference_code: string | null;
  imageCount: number;
};

function hasText(value: Json): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
}

/** Gaps present on a public listing, in display order. Empty means fine. */
export function publishedGaps(row: PublishedGapRow): PublishedGapKey[] {
  const gaps: PublishedGapKey[] = [];
  if (!hasText(row.description)) gaps.push("description");
  if (row.geo_lat == null || row.geo_lng == null) gaps.push("map");
  if (row.imageCount < MIN_PUBLIC_PHOTOS) gaps.push("photos");
  if (!row.reference_code || row.reference_code.trim().length === 0) {
    gaps.push("reference");
  }
  return gaps;
}
