-- 1. Slug history: no anon readability. Redirects are resolved server-side.
DROP POLICY IF EXISTS "slug history read" ON public.listing_slug_history;
CREATE POLICY "slug history read" ON public.listing_slug_history
  FOR SELECT TO authenticated
  USING (public.current_user_is_active());
REVOKE SELECT ON public.listing_slug_history FROM anon;

COMMENT ON TABLE public.listing_slug_history IS
  'Superseded listing slugs for 301 redirects. Deliberately NOT readable by anon: it would let anyone enumerate slugs and ids of draft/archived listings. Redirects are resolved in a server function with the service-role client, which then confirms the target through listings_public, so a superseded slug of a non-public listing resolves to nothing.';

-- 2. Dashboard RPCs assert their own permission, through the existing helpers.
CREATE OR REPLACE FUNCTION public.admin_dashboard_metrics(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  IF NOT (
    public.current_user_has_permission('listing.edit.any')
    OR public.current_user_has_permission('listing.edit.own')
  ) THEN
    RAISE EXCEPTION 'Permission denied: dashboard metrics require listing edit permission';
  END IF;

  RETURN (SELECT jsonb_build_object(
    'listings_by_status', COALESCE((
      SELECT jsonb_object_agg(t.status, t.c)
      FROM (SELECT status, count(*) AS c FROM public.listings GROUP BY status) t
    ), '{}'::jsonb),
    'inquiries_by_type', COALESCE((
      SELECT jsonb_object_agg(t.type, t.c)
      FROM (
        SELECT type, count(*) AS c
        FROM public.inquiries
        WHERE created_at >= _from AND created_at < _to
        GROUP BY type
      ) t
    ), '{}'::jsonb),
    'closed_in_period', COALESCE((
      SELECT jsonb_object_agg(t.k, t.c)
      FROM (
        SELECT CASE WHEN status = 'rented' THEN 'rented' ELSE 'sold' END AS k, count(*) AS c
        FROM public.listings
        WHERE status IN ('sold','rented')
          AND sold_at IS NOT NULL
          AND sold_at >= _from AND sold_at < _to
        GROUP BY 1
      ) t
    ), '{}'::jsonb),
    'processing', (
      SELECT jsonb_build_object(
        'sample', count(*),
        'avg_seconds', CASE
          WHEN count(*) = 0 THEN NULL
          ELSE round(avg(EXTRACT(epoch FROM (handled_at - created_at))))::bigint
        END
      )
      FROM public.inquiries
      WHERE handled_at IS NOT NULL
        AND handled_at >= _from AND handled_at < _to
    ),
    'total_listings', (SELECT count(*) FROM public.listings)
  ));
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_stale_active(_days integer, _limit integer)
RETURNS TABLE(id uuid, slug text, title jsonb, published_at timestamptz, total bigint)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
BEGIN
  IF NOT (
    public.current_user_has_permission('listing.edit.any')
    OR public.current_user_has_permission('listing.edit.own')
  ) THEN
    RAISE EXCEPTION 'Permission denied: stale listing report requires listing edit permission';
  END IF;

  RETURN QUERY
  WITH stale AS (
    SELECT l.id, l.slug, l.title, l.published_at
    FROM public.listings l
    WHERE l.status = 'active'
      AND l.published_at IS NOT NULL
      AND l.published_at < now() - make_interval(days => GREATEST(_days, 0))
      AND NOT EXISTS (
        SELECT 1 FROM public.inquiries q WHERE q.listing_id = l.id
      )
  )
  SELECT s.id, s.slug, s.title, s.published_at, (SELECT count(*) FROM stale)
  FROM stale s
  ORDER BY s.published_at ASC
  LIMIT GREATEST(_limit, 1);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_dashboard_metrics(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_dashboard_metrics(timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_metrics(timestamptz, timestamptz) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_stale_active(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_stale_active(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_stale_active(integer, integer) TO authenticated, service_role;

-- 3. View counter: server-side only. Called through the service-role client.
REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_listing_view(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_view(uuid) TO service_role;
COMMENT ON FUNCTION public.increment_listing_view(uuid) IS
  'Atomic +1 on listings.view_count. Executable by service_role only: the counter is bumped from a server function that already filters bots, prefetches and signed-in visits. Granting anon EXECUTE would let anyone inflate any published listing''s count.';

-- 4. Permission vocabulary: not for anon.
DROP POLICY IF EXISTS "role_permissions readable by all" ON public.role_permissions;
CREATE POLICY "role_permissions readable by staff" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.role_permissions FROM anon;

-- 5. Caller-scoped helpers and trigger functions: not for anon.
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_is_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_active() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_has_permission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_has_permission(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(text[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.count_active_owners() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_active_owners() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.storage_can_edit_listing_object(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.storage_can_edit_listing_object(text, text) TO authenticated, service_role;

-- Trigger functions are invoked by the trigger, not via EXECUTE grants.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.listings_set_actor() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.listings_validate_energy_on_publish() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.permissions_guard_overrides() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_enforce_role_integrity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_protect_last_owner_del() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.profiles_protect_last_owner_upd() FROM PUBLIC, anon, authenticated;

-- 6. Document the two deliberate exceptions on the objects themselves.
COMMENT ON VIEW public.listings_public IS
  'Intentionally NOT security_invoker: anon has no SELECT on public.listings, so this owner-rights view is the only public door to listing data, and it filters status itself (active/coming_soon/reserved/sold/rented) while masking street/geo by geo_precision and commission by commission_note_public. Adding security_invoker would make it evaluate as anon, which cannot read public.listings — every public listing page, the index, the sold archive and all photos (the child views join this one) would return zero rows.';

COMMENT ON FUNCTION public.listing_is_public(uuid) IS
  'Intentionally SECURITY DEFINER and executable by anon: it is the USING expression of the anon SELECT policies on listing_images, listing_tours and listing_documents, which are read through security_invoker views and therefore evaluate as anon without any read on public.listings. Revoking EXECUTE from anon removes every photo, floor plan, tour and public document from the public site. It returns only a boolean about a listing''s published status.';