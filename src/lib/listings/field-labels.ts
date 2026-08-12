// Label keys that depend on the listing rather than on the component rendering
// it. Kept next to the visibility matrix so the admin form, the publish
// checklist and the public pages all resolve a label the same way and no
// component contains a deal-type ternary around a string.
import type { ListingShape, VisibleField } from "./field-visibility";

/** Where the string lives: the admin form or the public site. */
export type LabelScope = "admin" | "public";

const PREFIX: Record<LabelScope, string> = {
  admin: "admin.listings.fields",
  public: "listings.detail",
};

export type MoneyField =
  | "price"
  | "total_rent"
  | "service_charge"
  | "utilities_cost"
  | "deposit";

/**
 * `price` is Kaufpreis on a sale and Kaltmiete on a rental — genuinely two
 * names for one column, resolved in exactly one place.
 */
export function moneyLabelKey(
  shape: ListingShape,
  field: MoneyField,
  scope: LabelScope = "admin",
): string {
  const prefix = PREFIX[scope];
  if (field === "price") {
    return `${prefix}.price_${shape.deal_type === "rent" ? "rent" : "sale"}`;
  }
  return `${prefix}.${field}`;
}

/** Label key for the area field, so commercial reads "commercial area". */
export function areaLabelKey(propertyType: string, field: VisibleField): string {
  if (field === "usable_area" && propertyType === "commercial") {
    return "admin.listings.fields.usable_area_commercial";
  }
  return `admin.listings.fields.${field}`;
}
