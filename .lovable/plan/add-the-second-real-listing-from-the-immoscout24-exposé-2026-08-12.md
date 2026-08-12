# Add the second real listing from the ImmoScout24 exposé

Goal: a second real property live on the site, entered through the admin panel
with its photos and descriptions — no fictional content, no direct database
inserts.

## Starting point

The exposé link is protected by ImmoScout24's bot check: a plain page fetch
returns their "Gleich geht's weiter" verification page instead of the listing.
So step 1 is a genuine fetch attempt with a real browser, with clear fallbacks
if it stays blocked.

## Step 1 — Get the exposé content

Attempt, in order, until one works:

1. Open the exposé in a real headless browser with a normal German desktop
   profile, let the bot check resolve, then read the rendered page: title,
   description, all fact fields (price, Wohnfläche, rooms, floor, year built,
   Hausgeld, Provision, energy certificate data) and the address.
2. If the page renders but the bot check loops, read the same data from the
   embedded listing JSON the page ships to its own frontend.
3. If ImmoScout24 still blocks everything, stop and report that — then you
   paste the exposé text (or the exposé PDF) and I continue from step 3 with no
   loss of quality.

Photos: taken from the same rendered page — the full-size gallery images, in
gallery order, downloaded as originals. If the gallery is only reachable behind
the bot check, I report it and you drop the photo files into the admin upload
area yourself; everything else is still done.

## Step 2 — Map the data to the listing form

Content is filled into the existing fields, nothing invented:

- Property type drives which fields are shown (the existing type matrix), so
  the form matches an apartment vs house vs plot automatically.
- Bilingual fields (title, description, highlights): German from the exposé as
  the primary text, English as a faithful translation of the same content.
- Structured figures (area, rooms, floor, year, price, Hausgeld, Provision,
  energy class and source) go into their own fields — the public specification
  table is generated from them, so nothing is typed twice.
- Address goes in fully; the map pin is set by geocoding, corrected manually if
  the geocoder is off.
- Anything the exposé does not state stays empty. No guessed values.

## Step 3 — Enter it through the admin panel

Work happens in the real admin UI at /admin/listings, using the signed-in
session:

1. Create a new listing (auto-draft), fill the essentials, then the "More
   details" fields that the exposé actually provides.
2. Upload the photos through the image manager so they run through the existing
   browser-side optimisation (WebP card/detail/OG variants, originals kept
   private), set the primary photo and gallery order.
3. Work the publish checklist until it is clean.
4. Publish, so the listing is live.

## Step 4 — Verify on the public site

- Detail page: gallery, generated specification table, features, energy data,
  map pin, both languages.
- Listings index: two properties, correct count and filters.
- Homepage featured section: shows both.
- Enquiry form on the new listing submits.

## Technical notes

- Data entry is done by driving the admin UI, not by SQL inserts, so every
  trigger, validation and the image pipeline behave exactly as they do for you.
- Photo processing stays in the browser pipeline already in place; no new
  backend work.
- No client content is added to migrations or components; the listing lives in
  the database only.
