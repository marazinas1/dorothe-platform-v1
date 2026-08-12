ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_property_type_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_property_type_check
  CHECK (property_type = ANY (ARRAY['house','apartment','villa','townhouse','penthouse','country_house','land','commercial','garage','other']));