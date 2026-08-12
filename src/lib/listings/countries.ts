// Which countries a listing address may be in. Stored as an ISO code, never as
// a display string, so the label can be rendered in every interface language and
// the value stays comparable with `site_settings.country` (which drives the
// energy certificate validation).
//
// Deliberately not a world list: the template is sold in the DACH market, and a
// listing whose country disagrees with the site's country is the exception.

export const LISTING_COUNTRIES = ["DE", "AT", "CH"] as const;

export type ListingCountry = (typeof LISTING_COUNTRIES)[number];

/**
 * The options offered by the form: the DACH set, plus the site's own country
 * when a clone is configured outside it, so nothing already stored disappears.
 */
export function listingCountryOptions(
  siteCountry: string | null | undefined,
  current?: string | null,
): string[] {
  const options: string[] = [...LISTING_COUNTRIES];
  for (const value of [siteCountry, current]) {
    if (value && !options.includes(value)) options.push(value);
  }
  return options;
}
