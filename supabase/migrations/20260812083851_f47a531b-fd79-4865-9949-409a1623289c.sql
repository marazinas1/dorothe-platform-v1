-- Rental money fields. additional_costs is deliberately left alone: it is an
-- unused free-form jsonb bag that cannot carry CHECK constraints.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS utilities_cost numeric,
  ADD COLUMN IF NOT EXISTS deposit numeric,
  ADD COLUMN IF NOT EXISTS heating_costs_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commission_free boolean NOT NULL DEFAULT false;

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_utilities_cost_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_utilities_cost_check
  CHECK (utilities_cost IS NULL OR utilities_cost >= 0);

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_deposit_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_deposit_check
  CHECK (deposit IS NULL OR deposit >= 0);

-- Warmmiete: computed, rentals only. NULL for sales so a Kaufpreis can never be
-- published as a rent.
ALTER TABLE public.listings DROP COLUMN IF EXISTS total_rent;
ALTER TABLE public.listings
  ADD COLUMN total_rent numeric GENERATED ALWAYS AS (
    CASE WHEN deal_type = 'rent' AND price IS NOT NULL
      THEN price + COALESCE(utilities_cost, 0)
      ELSE NULL
    END
  ) STORED;

-- Switching deal_type clears the figures that no longer apply, so nothing stays
-- populated-but-hidden.
CREATE OR REPLACE FUNCTION public.listings_clear_deal_type_figures()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.deal_type IS NOT DISTINCT FROM OLD.deal_type THEN
    RETURN NEW;
  END IF;

  IF NEW.deal_type = 'sale' THEN
    NEW.utilities_cost := NULL;
    NEW.deposit := NULL;
    NEW.heating_costs_included := false;
  ELSIF NEW.deal_type = 'rent' THEN
    NEW.service_charge := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_clear_deal_type_figures_trg ON public.listings;
CREATE TRIGGER listings_clear_deal_type_figures_trg
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_clear_deal_type_figures();

-- Republish the public view with the new fields. Commission figures keep their
-- existing commission_note_public gate; commission_free is a disclosure, so it
-- is always visible.
DROP VIEW IF EXISTS public.listings_public CASCADE;
CREATE VIEW public.listings_public AS
SELECT
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at, is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period,
  CASE WHEN commission_note_public THEN commission_note ELSE NULL::text END AS commission_note,
  additional_costs,
  living_area, plot_area, usable_area, rooms, bedrooms, bathrooms,
  floor, total_floors, year_built, year_renovated,
  CASE WHEN geo_precision = 'exact' THEN address_street ELSE NULL::text END AS address_street,
  CASE WHEN geo_precision = 'exact' THEN address_number ELSE NULL::text END AS address_number,
  address_zip, address_city, address_region, address_country,
  CASE
    WHEN geo_precision = 'exact' THEN geo_lat
    WHEN geo_precision = 'approximate' THEN round(geo_lat, 3)
    ELSE NULL::numeric
  END AS geo_lat,
  CASE
    WHEN geo_precision = 'exact' THEN geo_lng
    WHEN geo_precision = 'approximate' THEN round(geo_lng, 3)
    ELSE NULL::numeric
  END AS geo_lng,
  geo_precision, energy, features, content_sections,
  condition, heating_type, availability_date,
  title, description, highlights, meta_title, meta_description,
  agent_id, created_at, updated_at,
  CASE WHEN commission_note_public THEN commission_value ELSE NULL::numeric END AS commission_value,
  CASE WHEN commission_note_public THEN commission_type ELSE NULL::text END AS commission_type,
  CASE WHEN commission_note_public THEN commission_payer ELSE NULL::text END AS commission_payer,
  commission_free,
  service_charge, utilities_cost, heating_costs_included, deposit, total_rent,
  rental_status, energy_exemption
FROM public.listings
WHERE status = ANY (ARRAY['active','coming_soon','reserved','sold','rented']);

GRANT SELECT ON public.listings_public TO anon, authenticated;
GRANT ALL ON public.listings_public TO service_role;

-- Recreate the dependent child views, unchanged, with their invoker rights.
CREATE VIEW public.listing_images_public WITH (security_invoker = true) AS
SELECT i.id, i.listing_id, i.storage_path, i.variants, i.alt_text, i.caption,
       i.sort_order, i.is_primary, i.is_floorplan, i.is_visualization,
       i.width, i.height, i.blurhash, i.created_at
FROM public.listing_images i
JOIN public.listings_public p ON p.id = i.listing_id;

CREATE VIEW public.listing_tours_public WITH (security_invoker = true) AS
SELECT t.id, t.listing_id, t.type, t.url, t.thumbnail_url, t.sort_order, t.created_at
FROM public.listing_tours t
JOIN public.listings_public p ON p.id = t.listing_id;

CREATE VIEW public.listing_documents_public WITH (security_invoker = true) AS
SELECT d.id, d.listing_id, d.type, d.storage_path, d.filename, d.is_public,
       d.requires_lead, d.created_at
FROM public.listing_documents d
JOIN public.listings_public p ON p.id = d.listing_id
WHERE d.is_public = true;

GRANT SELECT ON public.listing_images_public, public.listing_tours_public,
  public.listing_documents_public TO anon, authenticated;
GRANT ALL ON public.listing_images_public, public.listing_tours_public,
  public.listing_documents_public TO service_role;
