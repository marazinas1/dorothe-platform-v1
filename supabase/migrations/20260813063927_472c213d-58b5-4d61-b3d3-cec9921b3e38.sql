ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_headline jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_subline jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_sold_prices boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS valuation_offer jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.site_settings.hero_headline IS 'Localized hero headline (client copy, never in message files).';
COMMENT ON COLUMN public.site_settings.hero_subline IS 'Localized hero supporting line.';
COMMENT ON COLUMN public.site_settings.service_areas IS 'Array of area/town names the broker covers; listing-derived towns are only a fallback.';
COMMENT ON COLUMN public.site_settings.show_sold_prices IS 'When false (default) achieved prices are hidden on sold/rented listings.';
COMMENT ON COLUMN public.site_settings.valuation_offer IS 'Localized object: { body, deliverables: [], price_note }.';