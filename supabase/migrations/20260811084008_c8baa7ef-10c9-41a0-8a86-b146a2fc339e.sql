ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS background_color text,
  ADD COLUMN IF NOT EXISTS surface_color text,
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS muted_text_color text,
  ADD COLUMN IF NOT EXISTS border_color text,
  ADD COLUMN IF NOT EXISTS radius_scale text,
  ADD COLUMN IF NOT EXISTS button_style text;

COMMENT ON COLUMN public.site_settings.radius_scale IS 'Registry key from src/lib/theme/tokens.ts (sharp | soft | rounded).';
COMMENT ON COLUMN public.site_settings.button_style IS 'Registry key from src/lib/theme/tokens.ts (square | rounded | pill).';