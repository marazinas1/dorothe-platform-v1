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
  about_body: Record<string, string>;
}

export type HomepageSectionKey =
  | "hero"
  | "categories"
  | "featured"
  | "credibility"
  | "sold"
  | "about"
  | "team"
  | "areas"
  | "contact";

export type HeroVariant = "region" | "property" | "broker";

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
