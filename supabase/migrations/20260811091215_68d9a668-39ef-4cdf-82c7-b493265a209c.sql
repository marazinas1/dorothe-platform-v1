ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS service_charge numeric,
  ADD COLUMN IF NOT EXISTS commission_value numeric,
  ADD COLUMN IF NOT EXISTS commission_type text,
  ADD COLUMN IF NOT EXISTS commission_payer text,
  ADD COLUMN IF NOT EXISTS rental_status text,
  ADD COLUMN IF NOT EXISTS energy_exemption text,
  ADD COLUMN IF NOT EXISTS created_from_autodraft boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.listings_validate_new_market_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.commission_type IS NOT NULL AND NEW.commission_type NOT IN ('percent','amount') THEN
    RAISE EXCEPTION 'commission_type must be percent or amount';
  END IF;
  IF NEW.commission_payer IS NOT NULL AND NEW.commission_payer NOT IN ('buyer','seller','shared') THEN
    RAISE EXCEPTION 'commission_payer must be buyer, seller or shared';
  END IF;
  IF NEW.rental_status IS NOT NULL AND NEW.rental_status NOT IN ('let','vacant') THEN
    RAISE EXCEPTION 'rental_status must be let or vacant';
  END IF;
  IF NEW.energy_exemption IS NOT NULL
     AND NEW.energy_exemption NOT IN ('listed_building','new_build_pending','not_required') THEN
    RAISE EXCEPTION 'energy_exemption is not a known exemption';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_validate_new_market_fields_trg ON public.listings;
CREATE TRIGGER listings_validate_new_market_fields_trg
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_validate_new_market_fields();

-- Energy validation now honours documented GEG exemptions.
CREATE OR REPLACE FUNCTION public.listings_validate_energy_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  status_changed boolean;
  v_country text;
  missing text[];
BEGIN
  status_changed := (TG_OP = 'INSERT') OR (NEW.status IS DISTINCT FROM OLD.status);
  IF NOT status_changed THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('active','coming_soon') THEN RETURN NEW; END IF;
  IF NEW.energy_exemption IS NOT NULL THEN RETURN NEW; END IF;

  SELECT country INTO v_country FROM public.site_settings LIMIT 1;
  IF v_country IS NULL OR length(v_country) = 0 THEN
    RAISE EXCEPTION 'Site country is not configured; set site_settings.country before publishing listings';
  END IF;

  missing := public.validate_listing_energy(v_country, NEW.energy, NEW.property_type);
  IF array_length(missing, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'Missing or invalid energy fields for country %: %', v_country, array_to_string(missing, ', ');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE VIEW public.listings_public AS
 SELECT id,
    slug,
    reference_code,
    status,
    deal_type,
    property_type,
    published_at,
    sold_at,
    is_featured,
    is_exclusive,
    sort_order,
    price,
    price_on_request,
    price_period,
        CASE
            WHEN commission_note_public THEN commission_note
            ELSE NULL::text
        END AS commission_note,
    additional_costs,
    living_area,
    plot_area,
    usable_area,
    rooms,
    bedrooms,
    bathrooms,
    floor,
    total_floors,
    year_built,
    year_renovated,
        CASE
            WHEN geo_precision = 'exact'::text THEN address_street
            ELSE NULL::text
        END AS address_street,
        CASE
            WHEN geo_precision = 'exact'::text THEN address_number
            ELSE NULL::text
        END AS address_number,
    address_zip,
    address_city,
    address_region,
    address_country,
        CASE
            WHEN geo_precision = 'exact'::text THEN geo_lat
            WHEN geo_precision = 'approximate'::text THEN round(geo_lat, 3)
            ELSE NULL::numeric
        END AS geo_lat,
        CASE
            WHEN geo_precision = 'exact'::text THEN geo_lng
            WHEN geo_precision = 'approximate'::text THEN round(geo_lng, 3)
            ELSE NULL::numeric
        END AS geo_lng,
    geo_precision,
    energy,
    features,
    content_sections,
    condition,
    heating_type,
    availability_date,
    title,
    description,
    highlights,
    meta_title,
    meta_description,
    agent_id,
    created_at,
    updated_at,
        CASE
            WHEN commission_note_public THEN commission_value
            ELSE NULL::numeric
        END AS commission_value,
        CASE
            WHEN commission_note_public THEN commission_type
            ELSE NULL::text
        END AS commission_type,
        CASE
            WHEN commission_note_public THEN commission_payer
            ELSE NULL::text
        END AS commission_payer,
    service_charge,
    rental_status,
    energy_exemption
   FROM listings
  WHERE status = ANY (ARRAY['active'::text, 'coming_soon'::text, 'reserved'::text, 'sold'::text, 'rented'::text]);

GRANT SELECT ON public.listings_public TO anon, authenticated;
GRANT ALL ON public.listings_public TO service_role;