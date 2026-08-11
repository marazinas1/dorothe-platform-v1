// Shared, client-safe schema + constants for the admin listing form.
// The database remains the source of truth for status flow, slug generation
// and energy validation; these mirrors exist so the UI can guide the user
// before a round trip.
import { z } from "zod";

import { ENERGY_EXEMPTIONS } from "@/lib/validation/energy";

export const DEAL_TYPES = ["sale", "rent"] as const;

export const PROPERTY_TYPES = [
  "apartment",
  "house",
  "villa",
  "townhouse",
  "penthouse",
  "land",
  "commercial",
  "garage",
] as const;

export const LISTING_STATUSES = [
  "draft",
  "coming_soon",
  "active",
  "reserved",
  "sold",
  "rented",
  "archived",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const GEO_PRECISIONS = ["exact", "approximate", "hidden"] as const;

/** German-market fields. Commission disclosure is legally required in DE. */
export const COMMISSION_TYPES = ["percent", "amount"] as const;
export const COMMISSION_PAYERS = ["buyer", "seller", "shared"] as const;

/**
 * Tenancy state. Deliberately independent of deal_type: a property can be for
 * sale AND currently let at the same time (Kapitalanlage).
 */
export const RENTAL_STATUSES = ["let", "vacant"] as const;

/** Mirrors public.listings_enforce_status_flow. */
export const STATUS_FLOW: Record<ListingStatus, ListingStatus[]> = {
  draft: ["coming_soon", "active", "archived"],
  coming_soon: ["active", "archived", "draft"],
  active: ["reserved", "sold", "rented", "archived", "draft"],
  reserved: ["active", "sold", "rented"],
  sold: ["archived", "active"],
  rented: ["archived", "active"],
  archived: ["draft"],
};

export function allowedTransitions(from: string | null | undefined): ListingStatus[] {
  if (!from) return [];
  return STATUS_FLOW[from as ListingStatus] ?? [];
}

export const CONTENT_SECTION_KEYS = [
  "highlights",
  "property_info",
  "building_info",
  "surroundings",
] as const;

export type ContentSectionKey = (typeof CONTENT_SECTION_KEYS)[number];

/** jsonb translation map, e.g. { en: "Title", de: "Titel" }. */
const Translated = z.record(z.string(), z.string());

/** content_sections: [{ key, items: { en: [...], de: [...] } }] */
const ContentSection = z.object({
  key: z.enum(CONTENT_SECTION_KEYS),
  items: z.record(z.string(), z.array(z.string())),
});

const nullableNumber = z
  .union([z.number(), z.null()])
  .optional()
  .transform((v) => (v === undefined ? null : v));

const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v));

/** Optional single-choice field stored as NULL when unset. */
function nullableEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.enum(values), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v));
}

export const ListingFormSchema = z.object({
  id: z.string().uuid().optional(),

  // Basics
  title: Translated,
  description: Translated,
  meta_title: Translated.optional().default({}),
  meta_description: Translated.optional().default({}),
  deal_type: z.enum(DEAL_TYPES),
  property_type: z.enum(PROPERTY_TYPES),

  // Figures
  price: nullableNumber,
  price_on_request: z.boolean().default(false),
  price_period: nullableText,
  living_area: nullableNumber,
  plot_area: nullableNumber,
  usable_area: nullableNumber,
  rooms: nullableNumber,
  bedrooms: nullableNumber,
  bathrooms: nullableNumber,
  floor: nullableNumber,
  total_floors: nullableNumber,
  year_built: nullableNumber,
  year_renovated: nullableNumber,

  // Location
  address_street: nullableText,
  address_number: nullableText,
  address_zip: nullableText,
  address_city: nullableText,
  address_region: nullableText,
  address_country: nullableText,
  geo_lat: nullableNumber,
  geo_lng: nullableNumber,
  geo_precision: z.enum(GEO_PRECISIONS).default("approximate"),

  // Market fields (costs, commission, tenancy)
  service_charge: nullableNumber,
  commission_value: nullableNumber,
  commission_type: nullableEnum(COMMISSION_TYPES),
  commission_payer: nullableEnum(COMMISSION_PAYERS),
  rental_status: nullableEnum(RENTAL_STATUSES),
  availability_date: nullableText,

  // Energy + content
  energy: z.record(z.string(), z.unknown()).default({}),
  energy_exemption: nullableEnum(ENERGY_EXEMPTIONS),
  content_sections: z.array(ContentSection).default([]),
});

export type ListingFormValues = z.input<typeof ListingFormSchema>;
export type ListingFormParsed = z.output<typeof ListingFormSchema>;

/** Drop empty translations so the public fallback logic keeps working. */
export function pruneTranslations(
  value: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value ?? {})) {
    if (typeof v === "string" && v.trim().length > 0) out[k] = v.trim();
  }
  return out;
}
