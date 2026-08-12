ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seals jsonb NOT NULL DEFAULT '[]'::jsonb;