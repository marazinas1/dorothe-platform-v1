// Floor plans and renderings are documents, not photographs. Mixed into the
// gallery they break the reading of a property (a hand-drawn plan between two
// interior shots reads as a mistake), so they are separated here once and both
// blocks read from the same split.
export type GalleryImage = {
  id: string | null;
  variants: unknown;
  alt_text: unknown;
  caption?: unknown;
  sort_order: number | null;
  is_primary: boolean | null;
  is_floorplan?: boolean | null;
  is_visualization?: boolean | null;
};

export type ImageSplit<T> = {
  /** Photographs, primary first. */
  photos: T[];
  /** Floor plans and site plans. */
  floorplans: T[];
  /** Renderings and visualisations of an unbuilt or unfinished state. */
  visualizations: T[];
};

export function splitListingImages<T extends GalleryImage>(images: T[]): ImageSplit<T> {
  const photos: T[] = [];
  const floorplans: T[] = [];
  const visualizations: T[] = [];
  for (const img of images) {
    if (img.is_floorplan) floorplans.push(img);
    else if (img.is_visualization) visualizations.push(img);
    else photos.push(img);
  }
  // The cover photo leads the gallery even if its sort order says otherwise.
  photos.sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)));
  return { photos, floorplans, visualizations };
}
