// Per-country energy certificate validation. Mirrors the Postgres function
// public.validate_listing_energy so the admin UI shows the same errors before
// the user hits save. The database re-runs validation on publish; this is a
// UX aid, not the source of truth.
import { z } from "zod";

export const COUNTRIES = ["AT", "DE", "CH", "IS", "US"] as const;
export type Country = (typeof COUNTRIES)[number];

export const EXEMPT_PROPERTY_TYPES = ["land", "garage"] as const;

/**
 * Legal exemptions from the certificate requirement (GEG in DE, comparable
 * rules elsewhere). Set on the listing itself, because whether an exemption
 * applies is a property fact and not derivable from the property type alone.
 */
export const ENERGY_EXEMPTIONS = [
  "not_required",
  "listed_building",
  "new_build_pending",
] as const;

export type EnergyExemption = (typeof ENERGY_EXEMPTIONS)[number];

/**
 * Single source of truth for "does this listing need energy data?", mirroring
 * public.listings_validate_energy_on_publish. Used by the form, the publish
 * checklist and the public page so all three agree.
 */
export function isEnergyExempt(
  propertyType: string,
  exemption?: string | null,
): boolean {
  if (exemption) return true;
  return (EXEMPT_PROPERTY_TYPES as readonly string[]).includes(propertyType);
}

export const EFFICIENCY_CLASS_AT = [
  "A++", "A+", "A", "B", "C", "D", "E", "F", "G",
] as const;

export const EFFICIENCY_CLASS_DE = [
  "A+", "A", "B", "C", "D", "E", "F", "G", "H",
] as const;

const AT_SCHEMA = z.object({
  hwb: z.number({ required_error: "hwb", invalid_type_error: "hwb" }),
  eeb: z.number({ required_error: "eeb", invalid_type_error: "eeb" }),
  efficiency_class: z.enum(EFFICIENCY_CLASS_AT, {
    required_error: "efficiency_class",
    invalid_type_error: "efficiency_class",
  }),
  fgee: z.number().optional(),
  certificate_date: z.string().optional(),
  certificate_valid_until: z.string().optional(),
});

const DE_SCHEMA = z.object({
  certificate_type: z.enum(["Bedarfsausweis", "Verbrauchsausweis"], {
    required_error: "certificate_type",
    invalid_type_error: "certificate_type",
  }),
  final_energy: z.number({
    required_error: "final_energy",
    invalid_type_error: "final_energy",
  }),
  energy_source: z.string().min(1),
  efficiency_class: z.enum(EFFICIENCY_CLASS_DE, {
    required_error: "efficiency_class",
    invalid_type_error: "efficiency_class",
  }),
  year_built: z.number().int({ message: "year_built" }),
  certificate_date: z.string().optional(),
});

const PASSTHROUGH = z.object({}).passthrough();

export const energySchemas: Record<Country, z.ZodTypeAny> = {
  AT: AT_SCHEMA,
  DE: DE_SCHEMA,
  CH: PASSTHROUGH,
  IS: PASSTHROUGH,
  US: PASSTHROUGH,
};

export interface EnergyValidationResult {
  missing: string[];
}

const AT_REQUIRED_FIELDS = new Set(["hwb", "eeb", "efficiency_class"]);
const DE_REQUIRED_FIELDS = new Set([
  "certificate_type",
  "final_energy",
  "energy_source",
  "efficiency_class",
  "year_built",
]);

function requiredFieldsFor(country: Country): Set<string> {
  if (country === "AT") return AT_REQUIRED_FIELDS;
  if (country === "DE") return DE_REQUIRED_FIELDS;
  return new Set();
}

export function validateEnergy(
  country: Country,
  energy: unknown,
  propertyType: string,
): EnergyValidationResult {
  if ((EXEMPT_PROPERTY_TYPES as readonly string[]).includes(propertyType)) {
    return { missing: [] };
  }

  const schema = energySchemas[country];
  const result = schema.safeParse(energy ?? {});
  if (result.success) return { missing: [] };

  const required = requiredFieldsFor(country);
  const missing = new Set<string>();
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && required.has(field)) missing.add(field);
  }
  return { missing: [...missing] };
}
