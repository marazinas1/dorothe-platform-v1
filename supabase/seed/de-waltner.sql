-- =============================================================================
-- Client seed: Immobilienberatung Dorothe Waltner — Püttlingen, Germany
-- =============================================================================
-- REAL client configuration only: identity, locales, design tokens, contact,
-- credentials and homepage composition. It creates NO listings — the client
-- enters their own properties in the admin panel.
-- Optional fictional demo properties live in demo-listings.sql and must never
-- be run against a real client's database. See README.
-- =============================================================================



-- ---------------------------------------------------------------------------
-- 1. Site settings — one row per install, updated in place.
-- ---------------------------------------------------------------------------
-- primary_agent_photo_url points at the processed (EXIF-free, AVIF) portrait
-- in the public site-assets bucket. Clones overwrite it; when NULL the app
-- falls back to a neutral
-- silhouette placeholder shipped in src/assets so the hero never renders a
-- stranger's face on a demo that goes to a real named person.
UPDATE public.site_settings SET
  site_name        = 'Immobilienberatung Dorothe Waltner',
  legal_name       = 'Dorothe Waltner — Immobilienberatung',
  country          = 'DE',
  default_locale   = 'en',
  enabled_locales  = ARRAY['en','de'],
  service_region   = '{"de":"Saarland","en":"the Saarland"}'::jsonb,
  currency         = 'EUR',
  area_unit        = 'sqm',
  primary_color    = '#6B7259',
  secondary_color  = '#F0EEE9',
  accent_color     = '#A67C6D',
  -- Shared design tokens: one system for the public site and the admin panel.
  background_color = '#FBFAF8',
  surface_color    = '#FFFFFF',
  text_color       = '#23211F',
  muted_text_color = '#78736C',
  border_color     = '#E6E3DD',
  radius_scale     = 'soft',
  button_style     = 'rounded',
  -- Font registry keys (src/lib/theme/fonts.ts), never raw CSS stacks.
  font_heading     = 'fraunces',
  font_body        = 'inter',
  contact_email    = 'dorothe.waltner@gmail.com',
  contact_phone    = '0160 4444047',
  whatsapp         = NULL,
  address_street   = 'Kyllbergstraße 140',
  address_zip      = '66346',
  address_city     = 'Püttlingen',
  address_country  = 'Deutschland',
  geo_lat          = 49.2843,
  geo_lng          = 6.8862,
  primary_agent_name      = 'Dorothe Waltner',
  primary_agent_role      = 'Inhaberin & Immobilienmaklerin',
  primary_agent_photo_url = 'https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/agent/dorothe-waltner-portrait.avif',
  og_default_image        = 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1200&h=630&q=80',
  homepage_sections = '[
    {"key":"hero","enabled":true,"variant":"region","image":"https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=2400&q=80"},
    {"key":"categories","enabled":true},
    {"key":"featured","enabled":true},
    {"key":"credibility","enabled":true},
    {"key":"sold","enabled":true},
    {"key":"about","enabled":true},
    {"key":"team","enabled":false},
    {"key":"areas","enabled":true},
    {"key":"contact","enabled":true}
  ]'::jsonb,
  logo_url         = 'https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/brand/logo-4-waende-saar.png',
  seals = '[
    {"url":"https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/brand/seal-sprengnetter-immo-erbrecht.png",
     "label":{"de":"Sprengnetter Immo-Erbrechts-Expertin","en":"Sprengnetter certified property inheritance expert"}}
  ]'::jsonb,
  qualifications = '[
    "Dipl. Betriebswirtin (BA)",
    "Versicherungsfachwirtin (IHK)",
    "Immobilienmaklerin (IHK)",
    "Immobilienbewerterin (IHK)",
    "Sachverständige für Immobilienbewertung (DEKRA)",
    "Immo-Erbrechts-Expertin (Sprengnetter)",
    "Mitglied der Europäischen Immobilienakademie"
  ]'::jsonb,
  -- Credentials, not invented numbers: no years/volume claims until verified.
  credibility_stats = '[
    {"value":"IHK","label":{"de":"Immobilienmaklerin & Immobilienbewerterin","en":"Certified estate agent & property valuer"}},
    {"value":"DEKRA","label":{"de":"Sachverständige für Immobilienbewertung","en":"Certified property valuation expert"}},
    {"value":"Sprengnetter","label":{"de":"Immo-Erbrechts-Expertin","en":"Property inheritance law expert"}},
    {"value":"EIA","label":{"de":"Mitglied der Europäischen Immobilienakademie","en":"Member of the European Real Estate Academy"}}
  ]'::jsonb,
  credibility_heading = '{"de":"Warum Dorothe Waltner","en":"Why Dorothe Waltner"}'::jsonb,
  about_body = '{"de":"Ich begleite Eigentümer und Käufer im Saarland persönlich — von der ersten Wertermittlung bis zum Notartermin. Als Einzelmaklerin arbeite ich bewusst mit wenigen Objekten gleichzeitig, damit jedes die Aufmerksamkeit bekommt, die es verdient. Kein Callcenter, keine Übergabe an Kollegen: Sie sprechen mit mir.","en":"I personally guide owners and buyers across the Saarland — from the first valuation to signing at the notary. As a solo broker I deliberately handle only a handful of properties at a time, so each one gets the attention it deserves. No call centre, no handovers: you speak with me."}'::jsonb;
