-- 1. A security-definer helper so child-table policies can ask "is this listing
--    public?" without the caller needing read access to public.listings.
CREATE OR REPLACE FUNCTION public.listing_is_public(_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = _listing_id
      AND l.status = ANY (ARRAY['active','coming_soon','reserved','sold','rented'])
  )
$$;

GRANT EXECUTE ON FUNCTION public.listing_is_public(uuid) TO anon, authenticated, service_role;

-- 2. Rewrite the anon policies on the child tables to use the helper. Their
--    views are security_invoker, so their policies are evaluated as anon and
--    must not read public.listings directly once the grant is gone.
DROP POLICY IF EXISTS "listing_images anon select via view predicate" ON public.listing_images;
CREATE POLICY "listing_images anon select via view predicate"
  ON public.listing_images FOR SELECT TO anon
  USING (public.listing_is_public(listing_id));

DROP POLICY IF EXISTS "listing_tours anon select via view predicate" ON public.listing_tours;
CREATE POLICY "listing_tours anon select via view predicate"
  ON public.listing_tours FOR SELECT TO anon
  USING (public.listing_is_public(listing_id));

DROP POLICY IF EXISTS "listing_documents anon select via view predicate" ON public.listing_documents;
CREATE POLICY "listing_documents anon select via view predicate"
  ON public.listing_documents FOR SELECT TO anon
  USING (is_public = true AND public.listing_is_public(listing_id));

-- 3. Close the hole: listings_public (not security_invoker, owner-rights) becomes
--    the only public door to listing data.
DROP POLICY IF EXISTS "listings anon select public" ON public.listings;
REVOKE SELECT ON public.listings FROM anon;
