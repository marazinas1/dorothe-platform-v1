export type Country = "AT" | "DE" | "CH" | "IS" | "US";
export type AreaUnit = "sqm" | "sqft";

export interface SiteSettings {
  id: string;
  site_name: string;
  legal_name: string | null;
  country: Country;
  default_locale: string;
  enabled_locales: string[];
  /** Localized service region name, interpolated into translated copy. */
  service_region: Record<string, string>;
  /** Localized region with its preposition ("im Saarland", "in Bayern"). */
  service_region_in: Record<string, string>;
  currency: string;
  area_unit: AreaUnit;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  og_default_image: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  /** Surface + text neutrals — shared by the public site and the admin. */
  background_color: string | null;
  surface_color: string | null;
  text_color: string | null;
  muted_text_color: string | null;
  border_color: string | null;
  /** Registry keys from @/lib/theme/tokens. */
  radius_scale: string | null;
  button_style: string | null;
  font_heading: string | null;
  font_body: string | null;

  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  address_street: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  opening_hours: Record<string, any>;
  social: Record<string, any>;
  google_analytics_id: string | null;
  google_site_verification: string | null;
  plausible_domain: string | null;
  legal_impressum: Record<string, string>;
  legal_privacy: Record<string, string>;
  legal_terms: Record<string, string>;
  primary_agent_name: string | null;
  primary_agent_role: string | null;
  primary_agent_photo_url: string | null;
  homepage_sections: HomepageSection[];
  credibility_stats: CredibilityStat[];
  credibility_heading: Record<string, string>;
  /** Professional certifications, displayed as a calm list. */
  qualifications: string[];
  /** Certification / membership seals shown as images. */
  seals: Seal[];
  about_body: Record<string, string>;
  /** Localized hero headline / supporting line (client copy). */
  hero_headline: Record<string, string>;
  hero_subline: Record<string, string>;
  /** Areas the broker covers; listing towns are only a fallback. */
  service_areas: string[];
  /** Publish achieved prices on sold/rented listings. Off by default. */
  show_sold_prices: boolean;
  /** Localized valuation offer used by the valuation block. */
  valuation_offer: Record<string, ValuationOffer>;
}

export interface ValuationOffer {
  body: string;
  deliverables: string[];
  price_note: string;
}

export interface Seal {
  /** Public image URL of the seal. */
  url: string;
  label: Record<string, string>;
  /** Optional link to the issuing body. */
  href?: string;
}

export type HomepageSectionKey =
  | "hero"
  | "photoband"
  | "paths"
  | "valuation"
  | "categories"
  | "featured"
  | "credibility"
  | "sold"
  | "about"
  | "team"
  | "areas"
  | "contact";

/** The two supported hero layouts. */
export type HeroLayout = "text" | "split";
/** Stored variant: the two layouts plus legacy values kept readable. */
export type HeroVariant = HeroLayout | "region" | "property" | "broker";

export interface HomepageSection {
  key: HomepageSectionKey;
  enabled: boolean;
  variant?: HeroVariant;
  /** Optional section background/lead photograph URL (used by the hero). */
  image?: string;
}

export interface CredibilityStat {
  value: string;
  label: Record<string, string>;
}
