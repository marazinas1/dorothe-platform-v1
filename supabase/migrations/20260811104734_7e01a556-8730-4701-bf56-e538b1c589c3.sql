-- 1. Condition: seven standard German-market values, stable English keys.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_condition_check;

UPDATE public.listings SET condition = CASE condition
  WHEN 'new' THEN 'first_occupancy'
  WHEN 'good' THEN 'well_kept'
  WHEN 'renovated' THEN 'renovated'
  WHEN 'needs_renovation' THEN 'needs_renovation'
  ELSE condition
END
WHERE condition IS NOT NULL;

ALTER TABLE public.listings ADD CONSTRAINT listings_condition_check CHECK (
  condition IS NULL OR condition = ANY (ARRAY[
    'first_occupancy','like_new','renovated','modernised',
    'well_kept','needs_renovation','for_demolition'
  ])
);

-- 2. Heating: map existing German free text onto the nine standard keys.
UPDATE public.listings SET heating_type = CASE
  WHEN heating_type IS NULL OR btrim(heating_type) = '' THEN NULL
  WHEN heating_type ILIKE '%etagen%' THEN 'floor_level'
  WHEN heating_type ILIKE '%fußboden%' OR heating_type ILIKE '%fussboden%' THEN 'underfloor'
  WHEN heating_type ILIKE '%fernwärme%' OR heating_type ILIKE '%fernwaerme%' THEN 'district'
  WHEN heating_type ILIKE '%wärmepumpe%' OR heating_type ILIKE '%waermepumpe%' THEN 'heat_pump'
  WHEN heating_type ILIKE '%pellet%' THEN 'pellet'
  WHEN heating_type ILIKE '%nachtspeicher%' THEN 'night_storage'
  WHEN heating_type ILIKE '%öl%' OR heating_type ILIKE '%oel%' THEN 'oil'
  WHEN heating_type ILIKE '%gas%' THEN 'gas'
  WHEN heating_type ILIKE '%zentral%' THEN 'central'
  WHEN heating_type = ANY (ARRAY['central','floor_level','underfloor','district','gas','oil','heat_pump','pellet','night_storage']) THEN heating_type
  ELSE NULL
END;

-- Constrained by trigger rather than a CHECK so portal exports stay clean while
-- the column itself remains free-form for future markets.
CREATE OR REPLACE FUNCTION public.listings_validate_heating_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.heating_type IS NOT NULL AND btrim(NEW.heating_type) = '' THEN
    NEW.heating_type := NULL;
  END IF;
  IF NEW.heating_type IS NOT NULL AND NEW.heating_type <> ALL (ARRAY[
    'central','floor_level','underfloor','district','gas','oil','heat_pump','pellet','night_storage'
  ]) THEN
    RAISE EXCEPTION 'invalid heating_type: %', NEW.heating_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_validate_heating_type ON public.listings;
CREATE TRIGGER listings_validate_heating_type
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_validate_heating_type();

-- 3. Features: align the legacy 'elevator' key with the shared vocabulary.
UPDATE public.listings
SET features = array_replace(features, 'elevator', 'lift')
WHERE 'elevator' = ANY (features);

-- 4. energy.energy_source becomes an array of standard keys. Existing German
--    free text is mapped explicitly; unmappable text becomes an empty array so
--    publish validation reports it as missing instead of silently passing.
CREATE OR REPLACE FUNCTION public.map_energy_source_text(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _input IS NULL OR btrim(_input) = '' THEN NULL
    WHEN _input = ANY (ARRAY['district_heating','natural_gas','lpg','heating_oil','electricity','heat_pump','wood_pellets','solar','geothermal','chp']) THEN _input
    WHEN _input ILIKE '%fernwärme%' OR _input ILIKE '%fernwaerme%' THEN 'district_heating'
    WHEN _input ILIKE '%flüssiggas%' OR _input ILIKE '%fluessiggas%' OR _input ILIKE '%lpg%' THEN 'lpg'
    WHEN _input ILIKE '%erdgas%' OR _input ILIKE '%gas%' THEN 'natural_gas'
    WHEN _input ILIKE '%heizöl%' OR _input ILIKE '%heizoel%' OR _input ILIKE '%öl%' OR _input ILIKE '%oel%' THEN 'heating_oil'
    WHEN _input ILIKE '%wärmepumpe%' OR _input ILIKE '%waermepumpe%' THEN 'heat_pump'
    WHEN _input ILIKE '%pellet%' THEN 'wood_pellets'
    WHEN _input ILIKE '%solar%' THEN 'solar'
    WHEN _input ILIKE '%erdwärme%' OR _input ILIKE '%erdwaerme%' OR _input ILIKE '%geotherm%' THEN 'geothermal'
    WHEN _input ILIKE '%blockheizkraftwerk%' OR _input ILIKE '%kwk%' THEN 'chp'
    WHEN _input ILIKE '%strom%' OR _input ILIKE '%elektr%' THEN 'electricity'
    ELSE NULL
  END;
$$;

UPDATE public.listings l
SET energy = jsonb_set(
  l.energy,
  '{energy_source}',
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT k)
      FROM (
        SELECT public.map_energy_source_text(btrim(part)) AS k
        FROM regexp_split_to_table(l.energy->>'energy_source', '\s*[,/;+]\s*|\s+und\s+') AS part
      ) mapped
      WHERE k IS NOT NULL
    ),
    '[]'::jsonb
  ),
  true
)
WHERE jsonb_typeof(l.energy->'energy_source') = 'string';

-- Normalise any pre-existing array form: drop unmappable entries.
UPDATE public.listings l
SET energy = jsonb_set(
  l.energy,
  '{energy_source}',
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT k)
      FROM (
        SELECT public.map_energy_source_text(elem) AS k
        FROM jsonb_array_elements_text(l.energy->'energy_source') AS elem
      ) mapped
      WHERE k IS NOT NULL
    ),
    '[]'::jsonb
  ),
  true
)
WHERE jsonb_typeof(l.energy->'energy_source') = 'array';

-- 5. Publish validation: energy_source must be a non-empty array of keys.
CREATE OR REPLACE FUNCTION public.validate_listing_energy(_country text, _energy jsonb, _property_type text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  missing text[] := ARRAY[]::text[];
  v text;
  src_count int;
BEGIN
  IF _property_type IN ('land','garage') THEN RETURN ARRAY[]::text[]; END IF;

  IF _country = 'AT' THEN
    IF NOT (_energy ? 'hwb') OR jsonb_typeof(_energy->'hwb') <> 'number' THEN missing := array_append(missing, 'hwb'); END IF;
    IF NOT (_energy ? 'eeb') OR jsonb_typeof(_energy->'eeb') <> 'number' THEN missing := array_append(missing, 'eeb'); END IF;
    v := _energy->>'efficiency_class';
    IF v IS NULL OR v NOT IN ('A++','A+','A','B','C','D','E','F','G') THEN missing := array_append(missing, 'efficiency_class'); END IF;

  ELSIF _country = 'DE' THEN
    v := _energy->>'certificate_type';
    IF v IS NULL OR v NOT IN ('Bedarfsausweis','Verbrauchsausweis') THEN missing := array_append(missing, 'certificate_type'); END IF;
    IF NOT (_energy ? 'final_energy') OR jsonb_typeof(_energy->'final_energy') <> 'number' THEN missing := array_append(missing, 'final_energy'); END IF;

    IF jsonb_typeof(_energy->'energy_source') = 'array' THEN
      SELECT count(*) INTO src_count
      FROM jsonb_array_elements_text(_energy->'energy_source') AS elem
      WHERE btrim(elem) <> '';
    ELSIF jsonb_typeof(_energy->'energy_source') = 'string' AND length(btrim(_energy->>'energy_source')) > 0 THEN
      src_count := 1;
    ELSE
      src_count := 0;
    END IF;
    IF src_count = 0 THEN missing := array_append(missing, 'energy_source'); END IF;

    v := _energy->>'efficiency_class';
    IF v IS NULL OR v NOT IN ('A+','A','B','C','D','E','F','G','H') THEN missing := array_append(missing, 'efficiency_class'); END IF;
    IF NOT (_energy ? 'year_built') OR jsonb_typeof(_energy->'year_built') <> 'number' THEN missing := array_append(missing, 'year_built'); END IF;
  END IF;

  RETURN missing;
END;
$$;

-- 6. Price period: allow a weekly period alongside month and total.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_price_period_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_price_period_check CHECK (
  price_period IS NULL OR price_period = ANY (ARRAY['month','week','total'])
);