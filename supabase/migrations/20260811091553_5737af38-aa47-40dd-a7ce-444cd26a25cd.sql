ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_property_type_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_property_type_check
  CHECK (property_type = ANY (ARRAY['house','apartment','villa','townhouse','penthouse','land','commercial','garage','other']));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_commission_type_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_commission_type_check
  CHECK (commission_type IS NULL OR commission_type = ANY (ARRAY['percent','amount']));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_commission_payer_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_commission_payer_check
  CHECK (commission_payer IS NULL OR commission_payer = ANY (ARRAY['buyer','seller','shared']));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_rental_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_rental_status_check
  CHECK (rental_status IS NULL OR rental_status = ANY (ARRAY['let','vacant']));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_energy_exemption_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_energy_exemption_check
  CHECK (energy_exemption IS NULL OR energy_exemption = ANY (ARRAY['not_required','listed_building','new_build_pending']));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_service_charge_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_service_charge_check
  CHECK (service_charge IS NULL OR service_charge >= 0);

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_commission_value_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_commission_value_check
  CHECK (commission_value IS NULL OR commission_value >= 0);