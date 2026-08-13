import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";
import type {
  HeroLayout,
  HomepageSection,
  SiteSettings,
  ValuationOffer,
} from "@/types/site-settings";

/**
 * The homepage is a block library that site_settings arranges. This module
 * resolves the whole page plan once, before render, so that two blocks can
 * never disagree about the same asset (most importantly the single portrait).
 */

/** Legacy variants stay valid: they map onto the two supported layouts. */
function normalizeLayout(variant: string | undefined, hasImage: boolean): HeroLayout {
  if (variant === "text") return "text";
  if (variant === "split") return hasImage ? "split" : "text";
  // region / property / broker rows from earlier clients.
  if (variant === "broker") return hasImage ? "split" : "text";
  return hasImage ? "split" : "text";
}

function sameImage(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().split("?")[0] === b.trim().split("?")[0];
}

export interface HomepagePlan {
  heroLayout: HeroLayout;
  /** Image for the split hero; null whenever the layout is text. */
  heroImage: string | null;
  /** Portrait for the "who she is" block; null when the hero already shows it. */
  aboutPortrait: string | null;
}

/**
 * `split` with no usable image degrades to `text` — never a grey rectangle.
 * When the hero image IS the portrait, the about block drops its image
 * automatically, so one portrait can never render twice.
 */
export function buildHomepagePlan(
  settings: SiteSettings,
  sections: HomepageSection[],
): HomepagePlan {
  const hero = sections.find((s) => s.key === "hero");
  const image = hero?.image?.trim() ? hero.image.trim() : null;
  const layout = normalizeLayout(hero?.variant, Boolean(image));
  const heroImage = layout === "split" ? image : null;
  const portrait = settings.primary_agent_photo_url?.trim() || null;
  return {
    heroLayout: layout,
    heroImage,
    aboutPortrait: sameImage(heroImage, portrait) ? null : portrait,
  };
}

/** Localized hero copy. Client copy lives in settings, never in messages. */
export function heroCopy(settings: SiteSettings, locale: string) {
  return {
    headline: pickLocalized(settings.hero_headline, locale, settings.default_locale) || "",
    subline: pickLocalized(settings.hero_subline, locale, settings.default_locale) || "",
  };
}

/** Localized valuation offer, or null when the client has not filled it in. */
export function valuationOffer(
  settings: SiteSettings,
  locale: string,
): ValuationOffer | null {
  const map = settings.valuation_offer ?? {};
  const value = (map[locale] ?? map[settings.default_locale] ?? Object.values(map)[0]) as
    | ValuationOffer
    | undefined;
  if (!value) return null;
  const deliverables = Array.isArray(value.deliverables) ? value.deliverables : [];
  if (!value.body && deliverables.length === 0) return null;
  return { body: value.body ?? "", deliverables, price_note: value.price_note ?? "" };
}

/**
 * Areas the broker covers. A client setting, because coverage is a statement
 * about the market — not a by-product of what happens to be for sale today.
 * The listing-derived towns are used only while the setting is empty.
 */
export function serviceAreas(settings: SiteSettings, listingCities: string[]): string[] {
  const configured = (settings.service_areas ?? [])
    .map((a) => (typeof a === "string" ? a.trim() : ""))
    .filter(Boolean);
  return configured.length > 0 ? configured : listingCities;
}

/** True when the configured list is in use, so the block can skip links. */
export function areasAreConfigured(settings: SiteSettings): boolean {
  return (settings.service_areas ?? []).filter(Boolean).length > 0;
}

/**
 * Decorative photo strip. One photo per listing first, then second photos of
 * the same listings, so a single property can never dominate the band. Small
 * `card` crops only — a small crop survives amateur photography.
 */
export function photoBandImages(listings: PublicListing[], want = 8): string[] {
  const rounds: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    for (const listing of listings) {
      const ordered = [...listing.images].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary),
      );
      const url = pickImageUrl(ordered[index]?.variants, "card");
      if (url && !rounds.includes(url)) rounds.push(url);
    }
  }
  return rounds.slice(0, want);
}

/**
 * German sellers do not expect the price they accepted to be published next to
 * photographs of their house. The achieved price is stripped in /lib so the
 * card component stays untouched, and only a deliberate client setting
 * (`show_sold_prices`) puts it back.
 */
export function withSoldPricePolicy(
  listing: PublicListing,
  settings: SiteSettings,
): PublicListing {
  const isClosed = listing.status === "sold" || listing.status === "rented";
  if (!isClosed || settings.show_sold_prices) return listing;
  return { ...listing, price: null, price_on_request: false };
}

export function applySoldPricePolicy(
  listings: PublicListing[],
  settings: SiteSettings,
): PublicListing[] {
  return listings.map((l) => withSoldPricePolicy(l, settings));
}

/**
 * Link-preview image. No stock photography: a featured listing's cover first,
 * then the broker portrait, then nothing at all.
 */
export function resolveSocialImage(
  settings: SiteSettings,
  featured: PublicListing[],
): string | null {
  if (settings.og_default_image?.trim()) return settings.og_default_image.trim();
  for (const listing of featured) {
    const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
    const url = pickImageUrl(primary?.variants, "og") ?? pickImageUrl(primary?.variants, "detail");
    if (url) return url;
  }
  return settings.primary_agent_photo_url?.trim() || null;
}

/** Evidence, not a catalogue: at most three properties on the homepage. */
export const HOMEPAGE_LISTING_LIMIT = 3;
