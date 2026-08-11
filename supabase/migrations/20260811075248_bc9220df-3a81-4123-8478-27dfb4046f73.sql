CREATE OR REPLACE FUNCTION public.listings_enforce_status_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  ok boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  ok := CASE OLD.status
    WHEN 'draft'       THEN NEW.status IN ('coming_soon','active','archived')
    WHEN 'coming_soon' THEN NEW.status IN ('active','archived','draft')
    WHEN 'active'      THEN NEW.status IN ('reserved','sold','rented','archived','draft')
    WHEN 'reserved'    THEN NEW.status IN ('active','sold','rented')
    WHEN 'sold'        THEN NEW.status IN ('archived','active')
    WHEN 'rented'      THEN NEW.status IN ('archived','active')
    WHEN 'archived'    THEN NEW.status IN ('draft')
    ELSE false
  END;

  IF NOT ok THEN
    RAISE EXCEPTION 'Invalid listing status transition: % -> %', OLD.status, NEW.status;
  END IF;

  IF NEW.status = 'active' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status IN ('sold','rented') AND NEW.sold_at IS NULL THEN
    NEW.sold_at := now();
  END IF;
  IF NEW.status = 'archived' AND NEW.archived_at IS NULL THEN
    NEW.archived_at := now();
  END IF;

  RETURN NEW;
END;
$function$;