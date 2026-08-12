CREATE OR REPLACE FUNCTION public.listings_clear_autodraft_flag()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.created_from_autodraft
     AND (
       COALESCE(jsonb_typeof(NEW.title), 'null') = 'object' AND NEW.title <> '{}'::jsonb
       OR COALESCE(jsonb_typeof(NEW.description), 'null') = 'object' AND NEW.description <> '{}'::jsonb
       OR NEW.address_city IS NOT NULL
       OR NEW.price IS NOT NULL
     )
  THEN
    NEW.created_from_autodraft := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_clear_autodraft_flag ON public.listings;
CREATE TRIGGER listings_clear_autodraft_flag
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.listings_clear_autodraft_flag();

-- Legacy rows: anything already worked on loses the flag.
UPDATE public.listings
SET created_from_autodraft = false
WHERE created_from_autodraft
  AND (
    title <> '{}'::jsonb
    OR description <> '{}'::jsonb
    OR address_city IS NOT NULL
    OR price IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.listing_images i WHERE i.listing_id = listings.id)
  );