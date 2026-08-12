ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_locale text;

COMMENT ON COLUMN public.profiles.admin_locale IS
  'Per-user admin interface language. NULL = follow site_settings.default_locale. Written only by the profile owner through a server function.';

-- Neutralise migration 20260803085652, which wrote client-specific values with
-- an unconditional UPDATE and would therefore follow every clone. The values
-- below are exactly the column defaults declared in 20260723120925 and
-- 20260724095459 — one definition of neutral. Real client values live in
-- supabase/seed/<client>.sql, which is applied after migrations.
UPDATE public.site_settings SET
  default_locale    = 'de',
  enabled_locales   = ARRAY['de','en']::text[],
  primary_color     = NULL,
  secondary_color   = NULL,
  accent_color      = NULL,
  font_heading      = NULL,
  font_body         = NULL,
  homepage_sections = '[
      {"key":"hero","enabled":true,"variant":"property"},
      {"key":"categories","enabled":true},
      {"key":"featured","enabled":true},
      {"key":"credibility","enabled":true},
      {"key":"sold","enabled":true},
      {"key":"about","enabled":true},
      {"key":"team","enabled":false},
      {"key":"areas","enabled":true},
      {"key":"contact","enabled":true}
    ]'::jsonb;