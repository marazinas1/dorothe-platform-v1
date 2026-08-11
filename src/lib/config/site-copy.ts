import { pickLocalized } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

/**
 * Interpolation values for client-specific words inside translations.
 *
 * Translation files must never contain a client's name, region or town names.
 * Instead they interpolate {{region}}, {{agent}} and {{city}}, and the values
 * come from site_settings through these accessors.
 */

/** Localized service region ("Saarland", "Aichfeld", …) with safe fallbacks. */
export function serviceRegion(settings: SiteSettings, locale: string): string {
  const value = pickLocalized(settings.service_region, locale, settings.default_locale);
  if (value) return value;
  return settings.address_city ?? settings.site_name;
}

/** Public-facing name of the primary contact person. */
export function agentName(settings: SiteSettings): string {
  return settings.primary_agent_name ?? settings.legal_name ?? settings.site_name;
}

/** A representative town used in examples and placeholders. */
export function exampleCity(settings: SiteSettings, locale: string): string {
  return settings.address_city ?? serviceRegion(settings, locale);
}

/** Convenience bundle for translate(locale, key, vars). */
export function copyVars(settings: SiteSettings, locale: string) {
  return {
    region: serviceRegion(settings, locale),
    agent: agentName(settings),
    city: exampleCity(settings, locale),
    site: settings.site_name,
  };
}
