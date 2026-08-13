# Rebuild the listing detail page (PLAN.md 7.4)

Reorder the page to the buyer's reading order, rebuild the sections that are
currently thin (gallery, key facts, specification, energy, map), and add the
three that do not exist yet (floor plans, documents, related properties).

## Order after the rebuild

```text
1  Gallery                 8   Energy certificate
2  Headline + key facts     9   Documents
3  Description              10  Enquiry (agent + form)
4  Full specification       11  Related properties
5  Equipment and features   +   sticky price/enquiry rail (desktop)
6  Location and map
7  Floor plans
```

Equipment moves below the specification; the enquiry moves to the end. The
hand-written blocks (`highlights`, `surroundings`) are not a separate stop in
the order: highlights render with the description, surroundings render inside
the location section, which is where a buyer looks for them.

## Data: what the page does not load today

Verified against the current query and the public views.

- **Floor plans — already loaded.** `listing_images_public` exposes
  `is_floorplan` and `is_visualization`, and the query selects `*`, so the rows
  are already in the payload; only the TypeScript row type omits them. Widening
  that type is the whole change. This also fixes a real bug: the gallery
  currently shows floor plans among the photos.
- **Documents — one new read.** `listing_documents_public` is never queried.
  Section 9 needs it, so `getListingBySlug` gains a documents fetch alongside
  the existing images fetch. No admin UI writes documents yet, so it returns
  nothing today and the section stays hidden. This is the only query change.
- **Related properties — no new query.** `listPublicListings` already filters by
  city and price, so related is two calls to the existing function (same town,
  then a price band), with the current listing filtered out.
- **Tours** stay out. They are PLAN.md 7.5 and have no admin UI either.

Confirmed present in the current payload and needing no change: all structured
fields, rental figures, commission, `energy` (DE shape:
`certificate_type`, `final_energy`, `energy_source[]`, `year_built`,
`efficiency_class`), `features`, `content_sections`, geo fields.

## Gallery and SSR

Every photo is rendered server-side as a real `<img>` with its alt text, so
Google's crawl sees the whole set; nothing is injected by JavaScript. Lazy
loading is the browser's: the first three carry `loading="eager"` (the lead
image also `fetchpriority="high"`), the rest `loading="lazy" decoding="async"`
with `width`/`height` from the row so nothing shifts. The full-screen viewer is
a client-only overlay mounted on first open, with arrow-key and Escape
navigation, a photo counter, and swipe on touch. SSR output is therefore
strictly larger in markup and identical in requests.

## The map before it is clicked

A block of the same 16/9 height as the map, so the page does not jump: hairline
border, muted surface, the town line (or the "approximate area" note when
`geo_precision = 'approximate'`), and a single "Karte anzeigen" button with one
quiet line saying the map loads tiles from an external provider. Until the click
there is no tile request and the map library chunk is never fetched.
`geo_precision` behaviour is unchanged — approximate keeps the rounded pin and
no street, hidden shows the town line and no map at all.

## The sticky element per breakpoint

- **Desktop (lg and up):** a sticky aside beside the description and
  specification — price with the correct label, deal type and status, the four
  key figures, an enquiry button and the phone number. It scrolls with the
  column and releases at the enquiry section.
- **Tablet and mobile (below lg):** no aside. A slim bottom action bar with the
  price and one enquiry button appears only after the gallery has scrolled past,
  and hides itself again while the enquiry section is on screen, so it can never
  cover the form or the footer. It respects the safe-area inset.

## Specification fields, per deal type

Grouped and generated from the existing visibility matrix; a field with no value
is omitted. Fields hidden for a property type (a plot has no rooms) never appear.

**Both deal types**
- Areas: Wohnfläche, Nutzfläche (Gewerbefläche for commercial), Grundstücksfläche
- Rooms: Zimmer, Schlafzimmer, Badezimmer, Etage (x/y), Etagenanzahl
- Condition and construction: Zustand, Heizungsart, Baujahr, Modernisierung
- Availability: Bezugsfrei ab, Objekt-Nr.

**Sale**
- Kaufpreis, Hausgeld (apartment/penthouse), Provision (percent or amount, plus
  who pays, or "provisionsfrei"), Vermietungsstand (vermietet/frei — an occupied
  sale is an investment, so the tenancy note appears here)

**Rent**
- Kaltmiete (with period), Nebenkosten, Warmmiete, Heizkosten in Nebenkosten
  enthalten, Kaution, Provision, Bezugsfrei ab

**Energy (own section, all types except land and garage)**
- Ausweisart (Verbrauchsausweis / Bedarfsausweis), Endenergieverbrauch or
  Endenergiebedarf — labelled from the certificate type, Energieeffizienzklasse
  with the A+–H scale, Energieträger (multiple), Baujahr laut Ausweis, or the
  stated exemption when `energy_exemption` is set.

The current energy panel shows Austrian fields (HWB, fGEE) that the German data
does not contain, which is why real listings currently show almost nothing
there. It is rebuilt for the German certificate and stays country-aware.

## Technical notes

- New in `/lib`: `listing-sections.ts` (which sections have content, so an empty
  one is never rendered as a bare heading), `spec-groups.ts` (the grouped
  specification rows), `related.ts` (same-town-then-price selection),
  `gallery-images.ts` (photos vs floor plans vs visualisations).
- Key facts reuse `cardSpecs` from `card-specs.ts` and the card's icon set —
  one list, not a second one. `ListingCard` itself is not touched.
- Spacing and type come from `SECTION_GAP` and the `text-hero` / `text-section*`
  / `text-lead` utilities. No new ad-hoc sizes, no hardcoded colours.
- Components stay under 200 lines: `ListingGallery`, `ListingKeyFacts`,
  `ListingDescription`, `ListingSpecs`, `ListingFeatures`, `ListingLocation`,
  `ListingFloorplans`, `EnergyPanel`, `ListingDocuments`, `ListingAgent`,
  `RelatedListings`, `ListingStickyRail`. The route composes them only.
- All new strings land in `de.json` and `en.json`; the i18n key check must pass.
- The page keeps rendering fully server-side: only the viewer overlay, the map
  after its click, and the sticky bar's scroll state are client behaviour.
