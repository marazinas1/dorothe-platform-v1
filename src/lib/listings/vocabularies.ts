// Shared, client-safe vocabularies for the listing form and the public pages.
// Stable English keys only — every label lives in src/messages/*.json, so a
// listing entered once reads correctly in every enabled language.
import type { PROPERTY_TYPES } from "./admin-schema";

export type PropertyType = (typeof PROPERTY_TYPES)[number];

/**
 * Equipment features. `types` declares which property types the feature applies
 * to, so a plot never offers a lift. Omitting `types` means "every type".
 */
export const LISTING_FEATURES: readonly { key: string; types?: readonly PropertyType[] }[] = [
  { key: "balcony", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "terrace", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "garden", types: ["apartment", "house", "villa", "townhouse", "penthouse"] },
  { key: "cellar", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "lift", types: ["apartment", "penthouse", "commercial"] },
  { key: "garage", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "parking_space", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial", "land"] },
  { key: "underground_parking", types: ["apartment", "penthouse", "commercial"] },
  { key: "fitted_kitchen", types: ["apartment", "house", "villa", "townhouse", "penthouse"] },
  { key: "guest_wc", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "barrier_free", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial", "garage"] },
  { key: "underfloor_heating", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "fireplace", types: ["apartment", "house", "villa", "townhouse", "penthouse"] },
  { key: "attic", types: ["house", "villa", "townhouse"] },
  { key: "storage_room", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial", "garage"] },
  { key: "high_ceilings", types: ["apartment", "house", "villa", "townhouse", "penthouse", "commercial"] },
  { key: "wooden_floors", types: ["apartment", "house", "villa", "townhouse", "penthouse"] },
] as const;

export const FEATURE_KEYS = LISTING_FEATURES.map((f) => f.key);

/** Feature keys that make sense for a given property type. */
export function featuresForType(propertyType: string): string[] {
  return LISTING_FEATURES.filter(
    (f) => !f.types || (f.types as readonly string[]).includes(propertyType),
  ).map((f) => f.key);
}

/** Drop selected features that stop applying when the property type changes. */
export function pruneFeatures(selected: string[], propertyType: string): string[] {
  const allowed = new Set(featuresForType(propertyType));
  return selected.filter((key) => allowed.has(key));
}

/** Seven standard German-market condition values. Mirrors listings_condition_check. */
export const LISTING_CONDITIONS = [
  "first_occupancy",
  "like_new",
  "renovated",
  "modernised",
  "well_kept",
  "needs_renovation",
  "for_demolition",
] as const;

/** Nine standard heating systems. Mirrors listings_validate_heating_type. */
export const HEATING_TYPES = [
  "central",
  "floor_level",
  "underfloor",
  "district",
  "gas",
  "oil",
  "heat_pump",
  "pellet",
  "night_storage",
] as const;

/** Standard energy sources. Stored as an array on energy.energy_source. */
export const ENERGY_SOURCES = [
  "district_heating",
  "natural_gas",
  "lpg",
  "heating_oil",
  "electricity",
  "heat_pump",
  "wood_pellets",
  "solar",
  "geothermal",
  "chp",
] as const;

/** Proper nouns, identical in every language — data, not UI copy. */
export const GERMAN_STATES = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;

/** True when the stored country value refers to Germany, code or name. */
export function isGermany(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "de" || v === "deutschland" || v === "germany";
}

/** Read energy.energy_source in either the legacy string or the array shape. */
export function readEnergySources(energy: Record<string, unknown> | undefined): string[] {
  const raw = energy?.["energy_source"];
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  if (typeof raw === "string" && raw.trim().length > 0) return [raw.trim()];
  return [];
}
