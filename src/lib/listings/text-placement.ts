// Where each written text ends up on the public site. Kept next to the other
// listing rules rather than in a component, because the admin form and the
// outline diagram must describe the same placement.

/** The four fields a broker writes by hand, in the order they are filled in. */
export const TEXT_FIELDS = ["title", "description", "highlights", "surroundings"] as const;

export type TextField = (typeof TEXT_FIELDS)[number];

/**
 * The public detail page as a plain stack of regions, top to bottom, in the
 * order the detail route renders them.
 */
export const OUTLINE_REGION_KEYS = [
  "hero",
  "facts",
  "description",
  "specs",
  "highlights",
  "surroundings",
  "rest",
] as const;

export type OutlineRegionKey = (typeof OUTLINE_REGION_KEYS)[number];

/**
 * Which of the four text fields fills which region. Regions without an entry
 * are generated from the structured fields, not written by hand.
 */
export const REGION_FIELD: Partial<Record<OutlineRegionKey, TextField>> = {
  hero: "title",
  description: "description",
  highlights: "highlights",
  surroundings: "surroundings",
};
