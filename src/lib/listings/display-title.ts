import { pickLocalized } from "./format";

/**
 * How a listing is named on public surfaces.
 *
 * The slug is a technical identifier and must never reach a visitor or a search
 * result — `apartment-d680` as a headline is a bug, not a fallback. So the
 * headline is the localized title or nothing at all, and anywhere a name is
 * structurally required (page <title>, meta description, an accessible link
 * name) we build a short descriptive one from data the listing always has:
 * property type and town.
 */

type Titleish = {
  title?: unknown;
  property_type?: string | null;
  address_city?: string | null;
};

type Translate = (
  key: string,
  vars?: Record<string, string | number | null | undefined>,
) => string;

/** Localized title, falling back across locales — never to the slug. */
export function listingHeadline(listing: Titleish, locale: string): string {
  return pickLocalized(listing.title, locale);
}

/**
 * Descriptive stand-in: "Wohnung in Kevelaer", or the bare property type when
 * the town is masked, or a generic "Immobilie" as the last resort.
 */
export function listingDescriptiveName(listing: Titleish, t: Translate): string {
  const type = listing.property_type
    ? t(`listings.propertyType.${listing.property_type}`)
    : "";
  const typeLabel = type && !type.startsWith("listings.") ? type : t("listings.card.property");
  const city = listing.address_city?.trim();
  if (city) return t("listings.card.type_in_city", { type: typeLabel, city });
  return typeLabel;
}

/** Name for titles, meta and accessible labels: always non-empty. */
export function listingDisplayName(
  listing: Titleish,
  locale: string,
  t: Translate,
): string {
  return listingHeadline(listing, locale) || listingDescriptiveName(listing, t);
}
