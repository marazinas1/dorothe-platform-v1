UPDATE public.site_settings SET
  hero_headline = '{
    "de":"Ihre Immobilie im Saarland — bewertet und verkauft von einer zertifizierten Sachverständigen.",
    "en":"Your property in the Saarland — valued and sold by a certified expert."
  }'::jsonb,
  hero_subline = '{
    "de":"Eine Maklerin, wenige Objekte gleichzeitig, volle Aufmerksamkeit für Ihres. Vom ersten Wertgutachten bis zum Notartermin sprechen Sie immer mit mir.",
    "en":"One broker, few properties at a time, full attention on yours. From the first valuation to the notary appointment you always speak with me."
  }'::jsonb,
  service_areas = '["Püttlingen","Völklingen","Riegelsberg","Heusweiler","Schwalbach","Saarbrücken","Saarlouis","Schmelz"]'::jsonb,
  show_sold_prices = false,
  valuation_offer = '{
    "de":{
      "body":"Ich bewerte Ihre Immobilie persönlich vor Ort — als von der DEKRA geprüfte Sachverständige für Immobilienbewertung, nicht per Online-Rechner.",
      "deliverables":[
        "Termin vor Ort mit Besichtigung und Aufnahme aller wertrelevanten Merkmale",
        "Marktwerteinschätzung auf Basis aktueller Vergleichsdaten aus dem Saarland",
        "Schriftliche Auswertung mit realistischer Preisspanne",
        "Persönliches Gespräch über Zeitpunkt, Unterlagen und Vermarktungsstrategie"
      ],
      "price_note":"Für Eigentümer, die einen Verkauf erwägen, ist die Wertermittlung kostenfrei und unverbindlich."
    },
    "en":{
      "body":"I value your property in person, on site — as a DEKRA-certified property valuation expert, not through an online calculator.",
      "deliverables":[
        "On-site appointment with a full survey of all value-relevant features",
        "Market value assessment based on current comparable data from the Saarland",
        "A written summary with a realistic price range",
        "A personal conversation about timing, documents and sales strategy"
      ],
      "price_note":"For owners considering a sale the valuation is free of charge and without obligation."
    }
  }'::jsonb,
  homepage_sections = '[
    {"key":"hero","enabled":true,"variant":"text"},
    {"key":"photoband","enabled":true},
    {"key":"about","enabled":true},
    {"key":"paths","enabled":true},
    {"key":"credibility","enabled":true},
    {"key":"featured","enabled":true},
    {"key":"sold","enabled":true},
    {"key":"valuation","enabled":true},
    {"key":"contact","enabled":true}
  ]'::jsonb,
  og_default_image = NULL;