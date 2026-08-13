CREATE OR REPLACE FUNCTION public.admin_stale_active(_days int, _limit int)
RETURNS TABLE (id uuid, slug text, title jsonb, published_at timestamptz, total bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.admin_dashboard_metrics(_from timestamptz, _to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
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
  );
$$;