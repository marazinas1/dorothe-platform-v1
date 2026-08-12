// Single source of truth for "which fields does this property type have, and
// is the field part of the short path to publish or of the details level?".
// The admin form, the publish checklist and the public specification block all
// read this map, so a per-type rule is defined exactly once.
//
// Principle for the split: a field is `open` when a buyer would ask about it
// before arranging a viewing. Everything else is `details`. `hidden` means the
// field does not apply to that property type at all — the stored value is left
// untouched, it is simply not edited or rendered.

export type FieldLevel = "open" | "details" | "hidden";

export type VisibleField =
  | "living_area"
  | "usable_area"
  | "plot_area"
  | "rooms"
  | "bedrooms"
  | "bathrooms"
  | "floor"
  | "total_floors"
  | "year_built"
  | "year_renovated"
  | "condition"
  | "heating_type"
  | "features"
  | "energy"
  | "service_charge"
  | "commission"
  | "rental_status"
  | "availability_date"
  | "reference_code"
  | "seo";

type Matrix = Record<string, Partial<Record<VisibleField, FieldLevel>>>;

/** Shared by every type unless the type overrides it. */
const BASE: Record<VisibleField, FieldLevel> = {
  living_area: "open",
  usable_area: "details",
  plot_area: "details",
  rooms: "open",
  bedrooms: "open",
  bathrooms: "open",
  floor: "details",
  total_floors: "details",
  year_built: "details",
  year_renovated: "details",
  condition: "open",
  heating_type: "open",
  features: "open",
  energy: "open",
  service_charge: "details",
  commission: "details",
  rental_status: "details",
  availability_date: "details",
  reference_code: "details",
  seo: "details",
};

const OVERRIDES: Matrix = {
  apartment: {
    plot_area: "hidden",
    // Third floor without a lift and ground floor are different propositions.
    floor: "open",
    total_floors: "open",
    // In the German market Hausgeld is asked immediately after the price.
    service_charge: "open",
  },
  house: {
    plot_area: "open",
    floor: "hidden",
  },
  country_house: {
    plot_area: "open",
    floor: "hidden",
  },
  land: {
    living_area: "hidden",
    usable_area: "hidden",
    plot_area: "open",
    rooms: "hidden",
    bedrooms: "hidden",
    bathrooms: "hidden",
    floor: "hidden",
    total_floors: "hidden",
    year_built: "hidden",
    year_renovated: "hidden",
    condition: "hidden",
    heating_type: "hidden",
    energy: "hidden",
    service_charge: "hidden",
  },
  commercial: {
    living_area: "hidden",
    // The single most important figure for a commercial property.
    usable_area: "open",
    rooms: "hidden",
    bedrooms: "hidden",
  },
  garage: {
    living_area: "hidden",
    plot_area: "hidden",
    rooms: "hidden",
    bedrooms: "hidden",
    bathrooms: "hidden",
    floor: "hidden",
    total_floors: "hidden",
    heating_type: "hidden",
    energy: "hidden",
    service_charge: "hidden",
  },
  // Legacy types kept for existing rows behave like their closest modern type.
  villa: { plot_area: "open", floor: "hidden" },
  townhouse: { plot_area: "open", floor: "hidden" },
  penthouse: { plot_area: "hidden", floor: "open", total_floors: "open", service_charge: "open" },
  other: {},
};

export function fieldLevel(propertyType: string, field: VisibleField): FieldLevel {
  return OVERRIDES[propertyType]?.[field] ?? BASE[field];
}

export function isOpen(propertyType: string, field: VisibleField): boolean {
  return fieldLevel(propertyType, field) === "open";
}

export function isDetail(propertyType: string, field: VisibleField): boolean {
  return fieldLevel(propertyType, field) === "details";
}

/** Visible at either level — used by the public specification block. */
export function applies(propertyType: string, field: VisibleField): boolean {
  return fieldLevel(propertyType, field) !== "hidden";
}

/** Keep only the fields of `keys` that sit at the given level for this type. */
export function fieldsAtLevel<T extends VisibleField>(
  propertyType: string,
  keys: readonly T[],
  level: FieldLevel,
): T[] {
  return keys.filter((key) => fieldLevel(propertyType, key) === level);
}

/** Label key for the area field, so commercial reads "commercial area". */
export function areaLabelKey(propertyType: string, field: VisibleField): string {
  if (field === "usable_area" && propertyType === "commercial") {
    return "admin.listings.fields.usable_area_commercial";
  }
  return `admin.listings.fields.${field}`;
}
