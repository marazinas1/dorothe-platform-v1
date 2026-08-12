// Single source of truth for "which fields does this listing have, and is the
// field part of the short path to publish or of the details level?". The admin
// form, the publish checklist and the public specification block all read this
// map, so a rule is defined exactly once.
//
// Two axes: property type (a plot has no rooms) and deal type (a sale has a
// Hausgeld, a rental has Nebenkosten and a Kaution). Components never test
// `deal_type === "rent"` themselves.
//
// Principle for the split: a field is `open` when a buyer or tenant would ask
// about it before arranging a viewing. Everything else is `details`. `hidden`
// means the field does not apply at all — the stored value is left untouched,
// it is simply not edited or rendered.

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
  | "price_period"
  | "service_charge"
  | "utilities_cost"
  | "heating_costs_included"
  | "total_rent"
  | "deposit"
  | "commission"
  | "rental_status"
  | "availability_date"
  | "reference_code"
  | "seo";

/** Everything the matrix needs to answer a question about a listing. */
export type ListingShape = {
  property_type: string;
  deal_type: string;
};

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
  price_period: "hidden",
  service_charge: "details",
  utilities_cost: "hidden",
  heating_costs_included: "hidden",
  total_rent: "hidden",
  deposit: "hidden",
  // Commission disclosure is legally expected in the German market, so it sits
  // next to the price rather than in the details level.
  commission: "open",
  rental_status: "details",
  availability_date: "details",
  reference_code: "details",
  seo: "details",
};

const BY_PROPERTY_TYPE: Matrix = {
  apartment: {
    plot_area: "hidden",
    // Third floor without a lift and ground floor are different propositions.
    floor: "open",
    total_floors: "open",
    // In the German market Hausgeld is asked immediately after the price.
    service_charge: "open",
  },
  house: { plot_area: "open", floor: "hidden" },
  country_house: { plot_area: "open", floor: "hidden" },
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

/**
 * Applied after the property-type rules. A rental's monthly figures replace the
 * sale's one-off ones; the database clears the values that no longer apply when
 * deal_type changes, so nothing stays populated but hidden.
 */
const BY_DEAL_TYPE: Matrix = {
  sale: {
    utilities_cost: "hidden",
    heating_costs_included: "hidden",
    total_rent: "hidden",
    deposit: "hidden",
    price_period: "hidden",
  },
  rent: {
    service_charge: "hidden",
    utilities_cost: "open",
    heating_costs_included: "open",
    total_rent: "open",
    deposit: "open",
    price_period: "open",
    // When a tenant can move in is a headline fact, not a detail.
    availability_date: "open",
    rental_status: "hidden",
  },
};

export function fieldLevel(shape: ListingShape, field: VisibleField): FieldLevel {
  const byProperty = BY_PROPERTY_TYPE[shape.property_type]?.[field];
  const byDeal = BY_DEAL_TYPE[shape.deal_type]?.[field];
  const base = byProperty ?? BASE[field];
  if (base === "hidden") return "hidden";
  return byDeal ?? base;
}

export function isOpen(shape: ListingShape, field: VisibleField): boolean {
  return fieldLevel(shape, field) === "open";
}

export function isDetail(shape: ListingShape, field: VisibleField): boolean {
  return fieldLevel(shape, field) === "details";
}

/** Visible at either level — used by the public specification block. */
export function applies(shape: ListingShape, field: VisibleField): boolean {
  return fieldLevel(shape, field) !== "hidden";
}

/** Keep only the fields of `keys` that sit at the given level for this listing. */
export function fieldsAtLevel<T extends VisibleField>(
  shape: ListingShape,
  keys: readonly T[],
  level: FieldLevel,
): T[] {
  return keys.filter((key) => fieldLevel(shape, key) === level);
}
