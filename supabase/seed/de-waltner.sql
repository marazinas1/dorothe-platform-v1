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
  -- German is the primary language; English exists so a non-German visitor can
  -- still navigate the site. The panel interface language is per user and lives
  -- on profiles.admin_locale, unrelated to these.
  default_locale   = 'de',
  enabled_locales  = ARRAY['de','en'],
  service_region   = '{"de":"Saarland","en":"the Saarland"}'::jsonb,
  service_region_in = '{"de":"im Saarland","en":"in Saarland"}'::jsonb,
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
  social           = '{"facebook":"https://www.facebook.com/dorothe.waltner/","linkedin":"https://www.linkedin.com/in/dorothe-waltner-a7411b180/"}'::jsonb,
  address_street   = 'Kyllbergstraße 140',
  address_zip      = '66346',
  address_city     = 'Püttlingen',
  address_country  = 'Deutschland',
  geo_lat          = 49.2843,
  geo_lng          = 6.8862,
  primary_agent_name      = 'Dorothe Waltner',
  primary_agent_role      = 'Inhaberin & Immobilienmaklerin',
  primary_agent_photo_url = 'https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/agent/dorothe-waltner-portrait.avif',
  -- No stock link-preview image: the resolver falls back to a featured
  -- listing cover, then to the portrait.
  og_default_image        = NULL,
  hero_headline = '{
    "de":"Ihre Immobilie im Saarland — bewertet und verkauft von einer zertifizierten Sachverständigen.",
    "en":"Your property in the Saarland — valued and sold by a certified expert."
  }'::jsonb,
  hero_subline = '{
    "de":"Eine Maklerin, wenige Objekte gleichzeitig, volle Aufmerksamkeit für Ihres. Vom ersten Wertgutachten bis zum Notartermin sprechen Sie immer mit mir.",
    "en":"One broker, few properties at a time, full attention on yours. From the first valuation to the notary appointment you always speak with me."
  }'::jsonb,
  service_areas = '["Püttlingen","Völklingen","Riegelsberg","Heusweiler","Schwalbach","Saarbrücken","Saarlouis","Schmelz"]'::jsonb,
  show_sold_prices = false,
  valuation_offer = '{
    "de":{
      "body":"Ich bewerte Ihre Immobilie persönlich vor Ort — als von der DEKRA geprüfte Sachverständige für Immobilienbewertung, nicht per Online-Rechner.",
      "deliverables":[
        "Termin vor Ort mit Besichtigung und Aufnahme aller wertrelevanten Merkmale",
        "Marktwerteinschätzung auf Basis aktueller Vergleichsdaten aus dem Saarland",
        "Schriftliche Auswertung mit realistischer Preisspanne",
        "Persönliches Gespräch über Zeitpunkt, Unterlagen und Vermarktungsstrategie"
      ],
      "price_note":"Für Eigentümer, die einen Verkauf erwägen, ist die Wertermittlung kostenfrei und unverbindlich."
    },
    "en":{
      "body":"I value your property in person, on site — as a DEKRA-certified property valuation expert, not through an online calculator.",
      "deliverables":[
        "On-site appointment with a full survey of all value-relevant features",
        "Market value assessment based on current comparable data from the Saarland",
        "A written summary with a realistic price range",
        "A personal conversation about timing, documents and sales strategy"
      ],
      "price_note":"For owners considering a sale the valuation is free of charge and without obligation."
    }
  }'::jsonb,
  -- Person first: the portrait opens the page beside the headline, and the
  -- evidence (credentials, properties, valuation) follows the argument.
  homepage_sections = '[
    {"key":"hero","enabled":true,"variant":"split","image":"https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/agent/dorothe-waltner-portrait.avif"},
    {"key":"paths","enabled":true},
    {"key":"credibility","enabled":true},
    {"key":"featured","enabled":true},
    {"key":"sold","enabled":true},
    {"key":"valuation","enabled":true},
    {"key":"contact","enabled":true}
  ]'::jsonb,

  logo_url         = 'https://pyuhysyizzmfvzdvbdnw.supabase.co/storage/v1/object/public/site-assets/brand/logo-4-waende-saar.png',
  -- Seals stay off for this client: the certification already appears in the
  -- credentials list, and a single round badge reads as a sticker on an
  -- otherwise typographic page. The mechanism remains for clients who want it.
  seals = '[]'::jsonb,
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
