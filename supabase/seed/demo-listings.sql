-- =============================================================================
-- OPTIONAL demo listings — invented properties for showing a fresh clone
-- =============================================================================
-- NEVER run this against a real client's database. It contains fictional
-- properties (Saarbrücken area, DE) used only for demos and screenshots.
-- Run a real client seed (e.g. de-waltner.sql) for configuration; run this
-- file on top of it only when a prospect needs to see a populated site.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Wipe existing listing data (demo reset).
-- ---------------------------------------------------------------------------
DELETE FROM public.inquiries;
DELETE FROM public.listing_documents;
DELETE FROM public.listing_tours;
DELETE FROM public.listing_images;
DELETE FROM public.listings;

-- ---------------------------------------------------------------------------
-- 2. Listings — eight sale-only properties in the Saarbrücken area.
-- ---------------------------------------------------------------------------
INSERT INTO public.listings (
  id, slug, reference_code, status, deal_type, property_type,
  published_at, sold_at,
  is_featured, is_exclusive, sort_order,
  price, price_on_request, price_period,
  additional_costs,
  living_area, plot_area, rooms, bedrooms, bathrooms, floor, total_floors,
  year_built, year_renovated,
  address_street, address_number, address_zip, address_city, address_region, address_country,
  geo_lat, geo_lng, geo_precision,
  energy, features, condition, heating_type,
  title, description, content_sections
) VALUES
-- 1. Einfamilienhaus — Püttlingen (featured)
(
  '33333333-0000-0000-0000-000000000001', 'einfamilienhaus-puettlingen-5-zimmer', 'DW-2024-001',
  'active','sale','house', now() - interval '14 days', NULL,
  true, false, 10,
  289000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  132, 405, 5, 3, 2, NULL, 2,
  1979, 2017,
  'Blumenweg', '14', '66346', 'Püttlingen', 'Saarland', 'Deutschland',
  49.2860, 6.8890, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":118,"energy_source":"Gas","efficiency_class":"D","year_built":1979}'::jsonb,
  ARRAY['garage','terrace','garden','cellar'],
  'good','Gas-Zentralheizung',
  '{"de":"Ein Zuhause zum Ankommen: Familienhaus in Püttlingen mit Garten","en":"A home to settle into: family house in Püttlingen with garden"}'::jsonb,
  '{"de":"Ich habe dieses Haus vor kurzem gemeinsam mit den Eigentümern angesehen und war sofort angetan — es ist eines dieser Objekte, in denen man merkt, dass die Familie hier gerne gelebt hat. Fünf Zimmer, ein sonniger Wohnbereich mit Zugang zur Terrasse und ein Garten, der Platz für Kinder, Beete und einen Grillabend bietet.\n\nDas Haus wurde 2017 innen sanft modernisiert: neue Böden im Erdgeschoss, ein frisches Familienbad, eine schön hergerichtete Küche. Substanz und Grundriss sind so, wie man sich das für eine ruhige Wohnstraße wünscht.\n\nPüttlingen ist überschaubar, freundlich und mit der Saarbahn in gut 25 Minuten in Saarbrücken. Wenn Sie über einen Umzug nachdenken, komme ich gerne mit Ihnen zur Besichtigung — ohne Zeitdruck.","en":"I recently walked through this house with the owners and immediately liked it — you can tell a family has been happy here. Five rooms, a sunny living area opening on to the terrace, and a garden with space for children, planting beds and an evening around the grill.\n\nThe interior was gently modernised in 2017: new flooring on the ground floor, a fresh family bathroom, a nicely kept kitchen. The layout and structure are exactly what you want from a quiet residential street.\n\nPüttlingen is small, friendly, and around 25 minutes from Saarbrücken by Saarbahn. If you are thinking about a move, I would be glad to view it with you — no pressure."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Sanft modernisiert 2017","Sonnige Süd-Terrasse","Gepflegter Garten 405 m²","Einzelgarage plus Stellplatz"],"en":["Gently modernised 2017","Sunny south-facing terrace","Well-kept 405 m² garden","Single garage plus parking"]}},
    {"key":"property_info","items":{"de":["5 Zimmer, 3 Schlafzimmer","132 m² Wohnfläche","Familienbad und Gäste-WC","Vollkeller mit Waschküche"],"en":["5 rooms, 3 bedrooms","132 m² living area","Family bath and guest WC","Full cellar with laundry"]}},
    {"key":"building_info","items":{"de":["Baujahr 1979, modernisiert 2017","Gas-Zentralheizung","Isolierverglasung","Energieklasse D"],"en":["Built 1979, modernised 2017","Gas central heating","Double glazing","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Grundschule in 5 Gehminuten","Rewe und Bäckerei fußläufig","Saarbahn-Haltestelle 600 m","Naherholung Köllertal"],"en":["Primary school 5 min walk","Supermarket and bakery walkable","Saarbahn stop 600 m","Köllertal recreation area"]}}
  ]'::jsonb
),
-- 2. Eigentumswohnung — Völklingen
(
  '33333333-0000-0000-0000-000000000002', 'eigentumswohnung-voelklingen-3-zimmer', 'DW-2024-002',
  'active','sale','apartment', now() - interval '9 days', NULL,
  true, false, 20,
  158000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig","hausgeld":"175 EUR / Monat"}'::jsonb,
  74, NULL, 3, 2, 1, 2, 4,
  1976, 2013,
  'Gartenstraße', '8', '66333', 'Völklingen', 'Saarland', 'Deutschland',
  49.2508, 6.8595, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":128,"energy_source":"Gas","efficiency_class":"D","year_built":1976}'::jsonb,
  ARRAY['balcony','cellar','elevator'],
  'good','Gas-Zentralheizung',
  '{"de":"Freundliche 3-Zimmer-Wohnung mit Balkon in Völklingen","en":"Friendly three-room apartment with balcony in Völklingen"}'::jsonb,
  '{"de":"Eine ehrliche, gut geschnittene Wohnung im zweiten Obergeschoss. Die Eigentümerin hat die Wohnung viele Jahre selbst bewohnt und immer wieder liebevoll instand gehalten — man merkt es an Kleinigkeiten: dem gepflegten Parkett, der ordentlich verlegten Tapete, dem sauberen Bad.\n\nDrei Zimmer, ein Süd-Balkon zum ruhigen Innenhof, eine separate Küche mit Fenster. Ein Aufzug ist vorhanden, der Kellerraum inklusive.\n\nDie Wohnung eignet sich sowohl zum Selbstbezug als auch als überschaubare Kapitalanlage — Völklingen ist mit der S-Bahn in zwölf Minuten in Saarbrücken.","en":"An honest, well-arranged apartment on the second floor. The owner lived here for many years and cared for it lovingly — you can tell in the details: the well-kept parquet, the tidy wallpaper, the clean bathroom.\n\nThree rooms, a south-facing balcony on a quiet courtyard, a separate kitchen with a window. Lift access, private cellar unit included.\n\nWorks equally well as a first home or as a modest investment — Völklingen is twelve minutes to Saarbrücken by S-Bahn."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Gepflegter Zustand","Süd-Balkon zum Innenhof","Aufzug im Haus","Ruhige Wohnlage"],"en":["Well-kept condition","South-facing courtyard balcony","Lift in building","Quiet residential setting"]}},
    {"key":"property_info","items":{"de":["3 Zimmer, 2 Schlafzimmer","74 m² Wohnfläche","2. Obergeschoss","Kellerraum inklusive"],"en":["3 rooms, 2 bedrooms","74 m² living area","2nd floor","Cellar unit included"]}},
    {"key":"building_info","items":{"de":["Baujahr 1976","Gas-Zentralheizung","Isolierverglasung 2013","Energieklasse D"],"en":["Built 1976","Gas central heating","Double glazing 2013","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Bahnhof Völklingen 900 m","Innenstadt fußläufig","A620 in 3 Minuten"],"en":["Völklingen station 900 m","Town centre walkable","A620 in 3 min"]}}
  ]'::jsonb
),
-- 3. Altbauwohnung — Saarbrücken (featured)
(
  '33333333-0000-0000-0000-000000000003', 'altbauwohnung-saarbruecken-st-johann-2-zimmer', 'DW-2024-003',
  'active','sale','apartment', now() - interval '6 days', NULL,
  true, false, 15,
  179000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig","hausgeld":"195 EUR / Monat"}'::jsonb,
  58, NULL, 2, 1, 1, 3, 4,
  1908, 2016,
  'Cecilienstraße', '19', '66111', 'Saarbrücken', 'Saarland', 'Deutschland',
  49.2360, 6.9985, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":108,"energy_source":"Gas","efficiency_class":"C","year_built":1908}'::jsonb,
  ARRAY['high_ceilings','wooden_floors','fitted_kitchen','cellar'],
  'renovated','Gas-Etagenheizung',
  '{"de":"Charmante Altbauwohnung in St. Johann — für zwei Menschen zum Verlieben","en":"Charming period apartment in St. Johann — a two-person home to fall for"}'::jsonb,
  '{"de":"Es gibt Wohnungen, in denen man beim ersten Rundgang stehen bleibt und einmal tief durchatmet. Diese hier gehört dazu: hohe Räume, ein sanft geknarrter Dielenboden, viel Tageslicht durch die alten Sprossenfenster.\n\n58 m² auf zwei Zimmer verteilt, ein wirklich gemütliches Wohnzimmer mit Blick auf die ruhige Seitenstraße, ein Schlafzimmer zum grünen Hof. Bad und Küche wurden 2016 sorgfältig erneuert — im Stil, der zum Haus passt.\n\nSt. Johann ist eines der Viertel, in denen sich in Saarbrücken das Leben abspielt. Ich vermittle diese Wohnung gerne an ein Paar oder einen Selbstnutzer, der Wert auf Charakter legt.","en":"Some apartments make you pause on the first walk-through and simply breathe in. This is one of them: tall rooms, softly creaking board floors, plenty of daylight through the original sash windows.\n\n58 m² across two rooms, a genuinely cosy living room facing the quiet side street, a bedroom towards the leafy courtyard. Bathroom and kitchen were carefully renewed in 2016 in a style that suits the building.\n\nSt. Johann is one of the neighbourhoods where Saarbrücken really lives. I would like to place this apartment with a couple or an owner-occupier who values character."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Sanierter Gründerzeit-Altbau","Originaler Dielenboden","Stuckdecken","Bad und Küche 2016 erneuert"],"en":["Renovated Wilhelminian building","Original board flooring","Stuccoed ceilings","Bath and kitchen renewed 2016"]}},
    {"key":"property_info","items":{"de":["2 Zimmer","58 m² Wohnfläche","3. Obergeschoss","Kellerraum"],"en":["2 rooms","58 m² living area","3rd floor","Cellar unit"]}},
    {"key":"building_info","items":{"de":["Baujahr 1908, saniert 2016","Gas-Etagenheizung","Energieklasse C"],"en":["Built 1908, renovated 2016","Gas boiler per unit","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["St. Johanner Markt 5 Gehminuten","Hauptbahnhof 12 Minuten zu Fuß","Cafés und kleine Läden in der Nachbarschaft"],"en":["St. Johanner Markt 5 min walk","Central station 12 min on foot","Cafés and small shops nearby"]}}
  ]'::jsonb
),
-- 4. Einfamilienhaus — Riegelsberg
(
  '33333333-0000-0000-0000-000000000004', 'einfamilienhaus-riegelsberg-6-zimmer', 'DW-2024-004',
  'active','sale','house', now() - interval '20 days', NULL,
  true, false, 25,
  379000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  158, 520, 6, 4, 2, NULL, 2,
  1992, 2019,
  'Ahornweg', '3', '66292', 'Riegelsberg', 'Saarland', 'Deutschland',
  49.3005, 6.9425, 'approximate',
  '{"certificate_type":"Bedarfsausweis","final_energy":98,"energy_source":"Gas","efficiency_class":"C","year_built":1992}'::jsonb,
  ARRAY['garage','terrace','garden','cellar','fitted_kitchen'],
  'renovated','Gas-Brennwert',
  '{"de":"Großzügiges Familienhaus mit sonnigem Garten in Riegelsberg","en":"Generous family home with sunny garden in Riegelsberg"}'::jsonb,
  '{"de":"Ein Haus mit Platz — und mit dem seltenen Vorzug, dass wirklich jeder Raum durchdacht ist. Sechs Zimmer, zwei Bäder, ein offener Wohn-Essbereich mit direktem Zugang zur Süd-Terrasse und ein 520 m² großer, gepflegter Garten.\n\n2019 wurde eine neue Gas-Brennwertheizung eingebaut und das Bad im Obergeschoss erneuert. Die Bausubstanz ist ausgezeichnet, die Ausstattung wertig und zeitlos.\n\nRiegelsberg ist ruhig, gut erschlossen und mit der Saarbahn zuverlässig an Saarbrücken angebunden. Ein Haus für eine Familie, die langfristig plant.","en":"A house with room to breathe — and the rare quality that every space feels considered. Six rooms, two bathrooms, an open living-and-dining area opening on to the south-facing terrace, and a well-kept 520 m² garden.\n\nA new gas condensing boiler was installed in 2019 and the upstairs bathroom renewed. The structure is excellent, the finishes solid and timeless.\n\nRiegelsberg is quiet, well-served, and reliably connected to Saarbrücken by Saarbahn. A house for a family planning long-term."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Neue Brennwertheizung 2019","Süd-Terrasse und großer Garten","Doppelgarage","Sehr gepflegter Zustand"],"en":["New condensing boiler 2019","South terrace and large garden","Double garage","Very well maintained"]}},
    {"key":"property_info","items":{"de":["6 Zimmer, 4 Schlafzimmer","158 m² Wohnfläche","2 Bäder, Gäste-WC","Einbauküche verbleibt","Vollkeller"],"en":["6 rooms, 4 bedrooms","158 m² living area","2 bathrooms, guest WC","Fitted kitchen included","Full cellar"]}},
    {"key":"building_info","items":{"de":["Baujahr 1992, modernisiert 2019","Gas-Brennwertheizung","Isolierverglasung","Energieklasse C"],"en":["Built 1992, modernised 2019","Gas condensing boiler","Double glazing","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["Grundschule 400 m","Rewe und Bäckerei fußläufig","Saarbahn-Anschluss","Köllertal in Gehweite"],"en":["Primary school 400 m","Supermarket and bakery walkable","Saarbahn access","Köllertal within walking distance"]}}
  ]'::jsonb
),
-- 5. Doppelhaushälfte — Püttlingen
(
  '33333333-0000-0000-0000-000000000005', 'doppelhaushaelfte-puettlingen-4-zimmer', 'DW-2024-005',
  'active','sale','house', now() - interval '28 days', NULL,
  false, false, 30,
  245000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig"}'::jsonb,
  118, 260, 4, 3, 1, NULL, 2,
  1968, 2011,
  'Lindenstraße', '27', '66346', 'Püttlingen', 'Saarland', 'Deutschland',
  49.2820, 6.8845, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":135,"energy_source":"Gas","efficiency_class":"D","year_built":1968}'::jsonb,
  ARRAY['garden','cellar','terrace'],
  'good','Gas-Zentralheizung',
  '{"de":"Solide Doppelhaushälfte mit Garten in Püttlingen","en":"Solid semi-detached home with garden in Püttlingen"}'::jsonb,
  '{"de":"Eine Doppelhaushälfte, wie sie im Saarland viele gibt — und die trotzdem etwas Besonderes hat: sehr sorgfältig gepflegt, ohne Sanierungsstau, mit einem kleinen, gut geschnittenen Garten und einer geschützten Terrasse.\n\nVier Zimmer, ein Wannenbad, Vollkeller. 2011 wurden die Fenster erneuert und die Fassade instand gesetzt. Ideal für ein Paar oder eine kleine Familie mit begrenztem Budget, das trotzdem ein eigenes Haus möchte.","en":"A semi-detached house of a kind you find often in the Saarland — and yet with something particular about it: very carefully looked after, no deferred maintenance, a small well-arranged garden and a sheltered terrace.\n\nFour rooms, a bathroom with tub, full cellar. Windows were renewed and the facade refreshed in 2011. Ideal for a couple or a small family on a modest budget who still want a house of their own."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Kein Sanierungsstau","Geschützte Terrasse","Gepflegter Garten","Ehrlicher Preis"],"en":["No deferred maintenance","Sheltered terrace","Well-kept garden","Honest asking price"]}},
    {"key":"property_info","items":{"de":["4 Zimmer, 3 Schlafzimmer","118 m² Wohnfläche","Wannenbad","Vollkeller"],"en":["4 rooms, 3 bedrooms","118 m² living area","Bathroom with tub","Full cellar"]}},
    {"key":"building_info","items":{"de":["Baujahr 1968, Fenster 2011","Gas-Zentralheizung","Isolierverglasung","Energieklasse D"],"en":["Built 1968, windows 2011","Gas central heating","Double glazing","Efficiency class D"]}},
    {"key":"surroundings","items":{"de":["Grundschule 500 m","Kleiner Wochenmarkt am Ort","Saarbahn in 10 Gehminuten"],"en":["Primary school 500 m","Small weekly market in town","Saarbahn 10 min walk"]}}
  ]'::jsonb
),
-- 6. Coming soon — Altbauwohnung Saarbrücken
(
  '33333333-0000-0000-0000-000000000006', 'altbauwohnung-saarbruecken-nauwieser-3-zimmer-in-vorbereitung', 'DW-2024-006',
  'coming_soon','sale','apartment', now() - interval '2 days', NULL,
  false, true, 35,
  219000, false, 'total', '{"maklerprovision":"3,57 % inkl. MwSt., käuferseitig","hausgeld":"215 EUR / Monat"}'::jsonb,
  82, NULL, 3, 2, 1, 2, 4,
  1905, 2020,
  'Försterstraße', '46', '66111', 'Saarbrücken', 'Saarland', 'Deutschland',
  49.2342, 7.0040, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":102,"energy_source":"Gas","efficiency_class":"C","year_built":1905}'::jsonb,
  ARRAY['high_ceilings','wooden_floors','cellar'],
  'renovated','Gas-Etagenheizung',
  '{"de":"3-Zimmer-Altbau am Nauwieser Viertel — Vermarktung in Vorbereitung","en":"Three-room period apartment near Nauwieser quarter — coming to market"}'::jsonb,
  '{"de":"Eine liebevoll sanierte Altbauwohnung im zweiten Obergeschoss eines Gründerzeithauses. Ich bereite die Unterlagen gerade mit den Eigentümern vor — Fotos, Grundriss und Energieausweis werden in der kommenden Woche freigegeben.\n\nWer sich vormerken lassen möchte, ist herzlich eingeladen mich anzurufen oder mir kurz zu schreiben. Ich melde mich persönlich zurück, sobald die Wohnung offiziell auf den Markt geht.","en":"A lovingly renovated period apartment on the second floor of a Wilhelminian townhouse. I am preparing the documents with the owners — photos, floor plan and energy certificate will be released next week.\n\nIf you would like to be added to the notification list, feel free to call me or send a short message. I will come back to you personally as soon as the apartment officially goes to market."}'::jsonb,
  '[
    {"key":"highlights","items":{"de":["Sanierter Altbau 2020","Ruhige Innenstadtlage","Vormerkung möglich"],"en":["Renovated period building 2020","Quiet inner-city location","Advance registration open"]}},
    {"key":"property_info","items":{"de":["3 Zimmer","82 m² Wohnfläche","2. Obergeschoss","Kellerraum"],"en":["3 rooms","82 m² living area","2nd floor","Cellar unit"]}},
    {"key":"building_info","items":{"de":["Baujahr 1905, saniert 2020","Gas-Etagenheizung","Energieklasse C"],"en":["Built 1905, renovated 2020","Gas boiler per unit","Efficiency class C"]}},
    {"key":"surroundings","items":{"de":["Nauwieser Platz 300 m","St. Johanner Markt 10 Gehminuten","Uni per Bus in 12 Minuten"],"en":["Nauwieser square 300 m","St. Johanner Markt 10 min walk","University by bus in 12 min"]}}
  ]'::jsonb
),
-- 7. Sold — Reihenhaus Völklingen (~3 months ago)
(
  '33333333-0000-0000-0000-000000000007', 'reihenhaus-voelklingen-verkauft', 'DW-2023-018',
  'sold','sale','house', now() - interval '7 months', now() - interval '3 months',
  false, false, 100,
  165000, false, 'total', '{}'::jsonb,
  108, 180, 4, 3, 1, NULL, 2,
  1965, 2009,
  NULL, NULL, '66333', 'Völklingen', 'Saarland', 'Deutschland',
  49.2492, 6.8608, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":142,"energy_source":"Gas","efficiency_class":"E","year_built":1965}'::jsonb,
  ARRAY['garden','cellar'],
  'good','Gas-Zentralheizung',
  '{"de":"Reihenhaus in Völklingen — für ein junges Paar aus der Region vermittelt","en":"Terraced house in Völklingen — sold to a young local couple"}'::jsonb,
  '{"de":"Ein ehrliches Reihenhaus mit kleinem Garten, das ich innerhalb von fünf Wochen an ein junges Paar aus dem Regionalverband vermitteln konnte","en":"An honest terraced house with a small garden, sold within five weeks to a young couple from the regional district"}'::jsonb,
  '[]'::jsonb
),
-- 8. Sold — 4-Zimmer-Wohnung Riegelsberg (~5 months ago)
(
  '33333333-0000-0000-0000-000000000008', 'eigentumswohnung-riegelsberg-verkauft', 'DW-2023-014',
  'sold','sale','apartment', now() - interval '9 months', now() - interval '5 months',
  false, false, 110,
  198000, false, 'total', '{}'::jsonb,
  92, NULL, 4, 2, 1, 1, 3,
  1982, 2014,
  NULL, NULL, '66292', 'Riegelsberg', 'Saarland', 'Deutschland',
  49.3012, 6.9432, 'approximate',
  '{"certificate_type":"Verbrauchsausweis","final_energy":122,"energy_source":"Gas","efficiency_class":"D","year_built":1982}'::jsonb,
  ARRAY['balcony','cellar'],
  'good','Gas-Zentralheizung',
  '{"de":"4-Zimmer-Wohnung in Riegelsberg — off-market vermittelt","en":"Four-room apartment in Riegelsberg — sold off-market"}'::jsonb,
  '{"de":"Eine gut geschnittene Wohnung mit Süd-Balkon, die ich an einen langjährigen Interessenten meiner Kartei vermittelt habe","en":"A well-arranged apartment with south-facing balcony, sold to a long-standing candidate on my register"}'::jsonb,
  '[]'::jsonb
);

-- ---------------------------------------------------------------------------
-- 3. Listing images.
-- Ordinary German family homes and apartments — not luxury villas.
-- ---------------------------------------------------------------------------
INSERT INTO public.listing_images (
  listing_id, storage_path, variants, is_primary, sort_order, processing_status, width, height, alt_text
)
SELECT
  l.id::uuid,
  'seed/' || l.slug || '/' || img.n::text || '.jpg',
  jsonb_build_object(
    'large',  jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=1600&q=80'),
    'medium', jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=900&q=80'),
    'thumb',  jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=480&q=70'),
    'og',     jsonb_build_object('url', img.base || '?auto=format&fit=crop&w=1200&h=630&q=80')
  ),
  img.n = 1,
  img.n - 1,
  'done',
  1600, 1067,
  '{}'::jsonb
FROM public.listings l
JOIN LATERAL (
  VALUES
    -- 1. Einfamilienhaus Püttlingen
    ('33333333-0000-0000-0000-000000000001'::uuid, 1, 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6'),
    ('33333333-0000-0000-0000-000000000001'::uuid, 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('33333333-0000-0000-0000-000000000001'::uuid, 3, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),
    ('33333333-0000-0000-0000-000000000001'::uuid, 4, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'),
    ('33333333-0000-0000-0000-000000000001'::uuid, 5, 'https://images.unsplash.com/photo-1505692795793-20f543407193'),

    -- 2. Wohnung Völklingen
    ('33333333-0000-0000-0000-000000000002'::uuid, 1, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'),
    ('33333333-0000-0000-0000-000000000002'::uuid, 2, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('33333333-0000-0000-0000-000000000002'::uuid, 3, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),
    ('33333333-0000-0000-0000-000000000002'::uuid, 4, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),

    -- 3. Altbau Saarbrücken St. Johann
    ('33333333-0000-0000-0000-000000000003'::uuid, 1, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'),
    ('33333333-0000-0000-0000-000000000003'::uuid, 2, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('33333333-0000-0000-0000-000000000003'::uuid, 3, 'https://images.unsplash.com/photo-1524230572899-a752b3835840'),
    ('33333333-0000-0000-0000-000000000003'::uuid, 4, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),

    -- 4. Einfamilienhaus Riegelsberg
    ('33333333-0000-0000-0000-000000000004'::uuid, 1, 'https://images.unsplash.com/photo-1449844908441-8829872d2607'),
    ('33333333-0000-0000-0000-000000000004'::uuid, 2, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0'),
    ('33333333-0000-0000-0000-000000000004'::uuid, 3, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914'),
    ('33333333-0000-0000-0000-000000000004'::uuid, 4, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811'),
    ('33333333-0000-0000-0000-000000000004'::uuid, 5, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c'),

    -- 5. Doppelhaushälfte Püttlingen
    ('33333333-0000-0000-0000-000000000005'::uuid, 1, 'https://images.unsplash.com/photo-1494526585095-c41746248156'),
    ('33333333-0000-0000-0000-000000000005'::uuid, 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'),
    ('33333333-0000-0000-0000-000000000005'::uuid, 3, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c8'),

    -- 6. Coming soon Saarbrücken
    ('33333333-0000-0000-0000-000000000006'::uuid, 1, 'https://images.unsplash.com/photo-1524230572899-a752b3835840'),
    ('33333333-0000-0000-0000-000000000006'::uuid, 2, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'),

    -- 7. Sold Völklingen
    ('33333333-0000-0000-0000-000000000007'::uuid, 1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'),
    ('33333333-0000-0000-0000-000000000007'::uuid, 2, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d'),

    -- 8. Sold Riegelsberg
    ('33333333-0000-0000-0000-000000000008'::uuid, 1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'),
    ('33333333-0000-0000-0000-000000000008'::uuid, 2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c')
) AS img(listing_id, n, base) ON img.listing_id = l.id;

-- ---------------------------------------------------------------------------
-- 3. Featured selection (homepage). Client-specific, so it lives here and not
--    in a migration.
-- ---------------------------------------------------------------------------
UPDATE public.listings SET is_featured = true
WHERE id IN (
  '33333333-0000-0000-0000-000000000002',
  '33333333-0000-0000-0000-000000000004'
);
