ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS service_region_in jsonb NOT NULL DEFAULT '{}'::jsonb;