ALTER TABLE public.listing_images
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz;

CREATE INDEX IF NOT EXISTS listing_images_stale_processing_idx
  ON public.listing_images (processing_started_at)
  WHERE processing_status = 'processing';