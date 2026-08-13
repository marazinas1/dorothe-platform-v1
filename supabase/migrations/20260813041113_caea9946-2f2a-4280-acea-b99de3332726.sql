-- 1. German-style transliteration
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF _input IS NULL THEN RETURN ''; END IF;
  s := lower(_input);
  s := replace(s, 'ä', 'ae');
  s := replace(s, 'ö', 'oe');
  s := replace(s, 'ü', 'ue');
  s := replace(s, 'ß', 'ss');
  s := replace(s, 'æ', 'ae');
  s := replace(s, 'ø', 'oe');
  s := replace(s, 'œ', 'oe');
  s := translate(s, 'áàâãåçéèêëíìîïñóòôõúùûýÿ', 'aaaaaceeeeiiiinoooouuuyy');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  RETURN s;
END;
$$;

-- 2. Slug history
CREATE TABLE IF NOT EXISTS public.listing_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listing_slug_history_listing_idx
  ON public.listing_slug_history(listing_id);

GRANT SELECT ON public.listing_slug_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_slug_history TO authenticated;
GRANT ALL ON public.listing_slug_history TO service_role;

ALTER TABLE public.listing_slug_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slug history read" ON public.listing_slug_history;
CREATE POLICY "slug history read" ON public.listing_slug_history
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "slug history write" ON public.listing_slug_history;
CREATE POLICY "slug history write" ON public.listing_slug_history
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('listing.edit.any'))
  WITH CHECK (public.current_user_has_permission('listing.edit.any'));

-- 3. Base slug from the title, with the old property_type/city/rooms fallback
CREATE OR REPLACE FUNCTION public.listing_slug_base(
  _title jsonb,
  _city text,
  _property_type text,
  _rooms numeric
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  loc text;
  title text;
  base text;
  city text;
BEGIN
  SELECT default_locale INTO loc FROM public.site_settings LIMIT 1;
  loc := coalesce(loc, 'de');

  title := nullif(btrim(coalesce(_title ->> loc, '')), '');
  IF title IS NULL THEN
    SELECT nullif(btrim(v), '')
      INTO title
      FROM jsonb_each_text(coalesce(_title, '{}'::jsonb)) AS e(k, v)
     WHERE nullif(btrim(v), '') IS NOT NULL
     LIMIT 1;
  END IF;

  IF title IS NULL THEN
    base := public.slugify(
      coalesce(_property_type, 'listing')
      || '-' || coalesce(_city, '')
      || CASE
           WHEN _rooms IS NOT NULL
           THEN '-' || regexp_replace(_rooms::text, '\.?0+$', '') || '-zimmer'
           ELSE ''
         END
    );
    RETURN coalesce(nullif(base, ''), 'listing');
  END IF;

  base := public.slugify(title);

  -- Truncate to ~60 characters on a word boundary.
  IF length(base) > 60 THEN
    base := left(base, 61);
    IF strpos(reverse(base), '-') > 0 THEN
      base := left(base, length(base) - strpos(reverse(base), '-'));
    END IF;
    base := regexp_replace(base, '-+$', '');
  END IF;

  city := public.slugify(coalesce(_city, ''));
  IF city <> '' AND position(city in base) = 0 THEN
    base := base || '-' || city;
  END IF;

  RETURN coalesce(nullif(base, ''), 'listing');
END;
$$;

-- 4. Reserved slugs: never shadow a locale prefix
CREATE OR REPLACE FUNCTION public.listing_slug_is_reserved(_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_settings s
     WHERE _slug = ANY (s.enabled_locales)
  ) OR _slug IN ('de', 'en', 'preview', 'api', 'admin');
$$;

-- 5. Unique candidate with the existing short random suffix
CREATE OR REPLACE FUNCTION public.listing_unique_slug(_base text, _id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  candidate text;
  attempt int := 0;
BEGIN
  LOOP
    candidate := _base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 4);
    IF NOT EXISTS (SELECT 1 FROM public.listings WHERE slug = candidate AND id <> _id)
       AND NOT EXISTS (
         SELECT 1 FROM public.listing_slug_history
          WHERE slug = candidate AND listing_id <> _id
       )
    THEN
      RETURN candidate;
    END IF;
    attempt := attempt + 1;
    IF attempt >= 5 THEN
      RETURN candidate || '-' || substr(md5(random()::text), 1, 4);
    END IF;
  END LOOP;
END;
$$;

-- 6. The trigger: generate on insert, follow the title until first publication,
--    accept deliberate manual changes, and record every superseded slug.
CREATE OR REPLACE FUNCTION public.listings_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  manual text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
      NEW.slug := public.listing_unique_slug(
        public.listing_slug_base(NEW.title, NEW.address_city, NEW.property_type, NEW.rooms),
        NEW.id
      );
      RETURN NEW;
    END IF;

    manual := public.slugify(NEW.slug);
    IF manual = '' THEN
      RAISE EXCEPTION 'slug_invalid';
    END IF;
    IF public.listing_slug_is_reserved(manual) THEN
      RAISE EXCEPTION 'slug_reserved:%', manual;
    END IF;
    IF EXISTS (SELECT 1 FROM public.listings WHERE slug = manual AND id <> NEW.id)
       OR EXISTS (
         SELECT 1 FROM public.listing_slug_history
          WHERE slug = manual AND listing_id <> NEW.id
       )
    THEN
      RAISE EXCEPTION 'slug_taken:%', manual;
    END IF;
    NEW.slug := manual;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := OLD.slug;
  END IF;
  NEW.slug := public.slugify(NEW.slug);
  IF NEW.slug = '' THEN
    RAISE EXCEPTION 'slug_invalid';
  END IF;

  IF NEW.slug <> OLD.slug THEN
    -- Deliberate manual change: validate hard, never silently rewrite.
    IF public.listing_slug_is_reserved(NEW.slug) THEN
      RAISE EXCEPTION 'slug_reserved:%', NEW.slug;
    END IF;
    IF EXISTS (SELECT 1 FROM public.listings WHERE slug = NEW.slug AND id <> NEW.id)
       OR EXISTS (
         SELECT 1 FROM public.listing_slug_history
          WHERE slug = NEW.slug AND listing_id <> NEW.id
       )
    THEN
      RAISE EXCEPTION 'slug_taken:%', NEW.slug;
    END IF;
  ELSIF OLD.published_at IS NULL THEN
    -- Never been public: the slug follows the title.
    base := public.listing_slug_base(NEW.title, NEW.address_city, NEW.property_type, NEW.rooms);
    IF regexp_replace(OLD.slug, '-[0-9a-f]{4}$', '') <> base THEN
      NEW.slug := public.listing_unique_slug(base, NEW.id);
    END IF;
  END IF;

  IF NEW.slug <> OLD.slug THEN
    DELETE FROM public.listing_slug_history WHERE slug = NEW.slug;
    INSERT INTO public.listing_slug_history (listing_id, slug)
    VALUES (NEW.id, OLD.slug)
    ON CONFLICT (slug) DO UPDATE SET listing_id = EXCLUDED.listing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_generate_slug_trg ON public.listings;
CREATE TRIGGER listings_generate_slug_trg
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_generate_slug();