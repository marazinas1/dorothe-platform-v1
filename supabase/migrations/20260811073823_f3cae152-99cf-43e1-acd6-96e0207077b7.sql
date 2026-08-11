-- Client content must never live in migrations: a fresh clone would inherit
-- another broker's bio, heading and portrait. Neutralise the values written by
-- the earlier setup steps; per-client content comes from
-- supabase/seed/<client>.sql instead.
UPDATE public.site_settings
SET credibility_heading = '{}'::jsonb
WHERE credibility_heading::text LIKE '%Dorothe Waltner%';

UPDATE public.site_settings
SET about_body = '{}'::jsonb
WHERE about_body::text LIKE '%Saarland%';

UPDATE public.site_settings
SET primary_agent_photo_url = NULL
WHERE primary_agent_photo_url LIKE '%dorothe-waltner-portrait%';

UPDATE public.listings SET is_featured = false
WHERE id IN (
  '33333333-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000004'
);
