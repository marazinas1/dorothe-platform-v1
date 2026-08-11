import { z } from "zod";

export const CountrySchema = z.enum(["AT", "DE", "CH", "IS", "US"]);
export const AreaUnitSchema = z.enum(["sqm", "sqft"]);

const nullableUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .or(z.literal(""))
  .nullable()
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

const nullableText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v == null ? null : v));

const nullableColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  .or(z.literal(""))
  .nullable()
  .optional()
  .transform((v) => (v === "" || v == null ? null : v));

const nullableNumber = z
  .union([z.number(), z.string()])
  .nullable()
  .optional()
  .transform((v) => {
    if (v === "" || v == null) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });

const localeMap = z.record(z.string(), z.string().max(20000)).default({});
const jsonRecord = z.record(z.string(), z.any()).default({});

export const GeneralSchema = z.object({
  site_name: z.string().trim().min(1).max(200),
  legal_name: nullableText(200),
  country: CountrySchema,
  default_locale: z.string().trim().min(2).max(10),
  enabled_locales: z.array(z.string().trim().min(2).max(10)).min(1),
  service_region: localeMap,
  currency: z.string().trim().min(3).max(10),
  area_unit: AreaUnitSchema,
});
export type GeneralInput = z.infer<typeof GeneralSchema>;

export const BrandingSchema = z.object({
  logo_url: nullableUrl,
  logo_dark_url: nullableUrl,
  favicon_url: nullableUrl,
  og_default_image: nullableUrl,
  primary_color: nullableColor,
  secondary_color: nullableColor,
  accent_color: nullableColor,
  background_color: nullableColor,
  surface_color: nullableColor,
  text_color: nullableColor,
  muted_text_color: nullableColor,
  border_color: nullableColor,
  radius_scale: z.enum(["sharp", "soft", "rounded"]).nullable().optional(),
  button_style: z.enum(["square", "rounded", "pill"]).nullable().optional(),
  font_heading: nullableText(100),
  font_body: nullableText(100),
});
export type BrandingInput = z.infer<typeof BrandingSchema>;

export const ContactSchema = z.object({
  contact_email: nullableText(320),
  contact_phone: nullableText(50),
  whatsapp: nullableText(50),
  address_street: nullableText(200),
  address_zip: nullableText(20),
  address_city: nullableText(100),
  address_country: nullableText(100),
  geo_lat: nullableNumber,
  geo_lng: nullableNumber,
  opening_hours: jsonRecord,
  social: jsonRecord,
});
export type ContactInput = z.infer<typeof ContactSchema>;

export const LegalSchema = z.object({
  legal_impressum: localeMap,
  legal_privacy: localeMap,
  legal_terms: localeMap,
});
export type LegalInput = z.infer<typeof LegalSchema>;

export const AnalyticsSchema = z.object({
  google_analytics_id: nullableText(100),
  google_site_verification: nullableText(200),
  plausible_domain: nullableText(200),
});
export type AnalyticsInput = z.infer<typeof AnalyticsSchema>;

/** Backwards-compatible alias used elsewhere. */
export const SiteSettingsSchema = GeneralSchema;

export const SITE_SETTINGS_SCHEMAS = {
  general: GeneralSchema,
  branding: BrandingSchema,
  contact: ContactSchema,
  legal: LegalSchema,
  analytics: AnalyticsSchema,
} as const;

export type SettingsTabKey = keyof typeof SITE_SETTINGS_SCHEMAS;
