ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_privacy_version text;

COMMENT ON COLUMN public.inquiries.consent_at IS 'When the visitor ticked the data-protection consent box (GDPR Art. 5(2) evidence).';
COMMENT ON COLUMN public.inquiries.consent_privacy_version IS 'Fingerprint of the privacy notice text shown at submit time.';

-- Fire-and-forget page-render counter for public listing detail pages.
-- No identifiers involved: it only bumps an integer.
CREATE OR REPLACE FUNCTION public.increment_listing_view(_listing_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings
     SET view_count = view_count + 1
   WHERE id = _listing_id
     AND status IN ('active', 'reserved', 'coming_soon', 'sold', 'rented');
$$;

REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid) TO service_role;