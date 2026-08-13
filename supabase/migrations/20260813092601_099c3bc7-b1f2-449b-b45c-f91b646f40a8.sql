INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('listing_documents', false, 'Downloadable documents on listing detail pages')
ON CONFLICT (key) DO NOTHING;