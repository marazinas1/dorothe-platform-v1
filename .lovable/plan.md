# Rebuild the listing card (PLAN.md 7.3)

One card component, used identically on the homepage, the catalogue, the sold
archive and the agent block. Sold emphasis stays a variant (`hidePrice`), not a
copy.

## 1. Equal height, always

The card becomes a flex column with `h-full`, and every grid cell stretches
(`items-stretch` is the grid default; the cards currently don't fill because
they are not `h-full` flex columns).

Fixed zones, top to bottom:

- media: unchanged `aspect-[3/2]`, so the tallest thing on the card can never vary
- meta row (status + city): one line, always rendered
- spec row: **always rendered**, fixed height (`min-h`), even when a listing has
  no figures at all — an empty spec row keeps its space rather than collapsing
- title: clamped to exactly 2 lines with a reserved 2-line box, so a one-line
  title occupies the same height as a two-line one
- description: clamped to 2 lines with a reserved 2-line box, rendered even when
  the listing has no description
- price row: pushed to the bottom with `mt-auto` and a hairline top border, so it
  sits on one line across the row

A very long title is clamped at two lines with an ellipsis (`line-clamp-2`), and
the full title is available to assistive tech and on hover via `title`. It never
pushes the price down. The clamp height is expressed in `em` from the card's own
type scale so a font change in `site_settings` cannot break the reservation.

Worst-case check: one-line title, no description, one spec chip beside a
two-line title with five chips plus energy class — verified in the browser at
mobile, 2-col and 3-col widths.

## 2. Icons instead of text labels

From `lucide-react` (already a dependency), four portal conventions:

- `Ruler` — living area (or plot area for land): the measuring convention every
  portal uses for m²
- `LayoutGrid` — rooms: a floor divided into cells, the standard "Zimmer" glyph
- `BedDouble` — bedrooms: unmistakable, no legend needed
- `Bath` — bathrooms: the tub is the universal bathroom sign

Each icon is `aria-hidden`, and the number carries a visually hidden label from
the message files (`5 Zimmer`, `2 Bäder`), so a screen reader reads
"5 Zimmer" and not "5". The icon also gets a `title` for pointer hover.

Energy class stays textual — letter grade plus its label, keeping the existing
`energyClassOf` / `energyClassTone` tokens, because it is a legal disclosure.

Icons are picked in `/lib` (`src/lib/listings/card-specs.ts`): a pure function
turns a listing plus settings into an ordered list of
`{ key, icon, value, label }`. The component only renders.

## 3. Photo carousel on the card

New `src/components/brand/ListingCardCarousel.tsx`, a CSS scroll-snap track —
no motion library, no JS layout, SSR-safe.

- The track renders **all** slides server-side, but only the cover image has a
  real `src`. Every other slide starts as an empty token-coloured placeholder and
  receives its `src` the first time the visitor interacts (swipe, arrow, dot,
  or pointer entering the media area). Once armed, the current, previous and next
  slides get real `src` values; the rest arm as browsing continues.
- Capped at 6 slides; if the listing has more, the last slide shows a `+N`
  affordance that reads as "there are more inside", and the card links through
  as usual.
- Ordering is the gallery's ordering (`sort_order`, cover first), so floor plans
  and visualisations will drop out automatically once those flags get a UI.
- Arrows appear on hover/focus for pointer devices only; dots show position and
  are real buttons. Touch users swipe the snap track natively.
- First paint of a 20-card catalogue page: 20 `card`-variant images, exactly what
  it costs today. Nothing else is fetched until interaction. No extra database
  work either — the list query already returns every image row per listing, so
  the carousel adds markup, not requests.

## 4. Link vs carousel on both input types

The card stays a single `<Link>` (one tab stop, one target). Inside it:

- Controls are `<button type="button">` with `onClick` calling
  `preventDefault()` and `stopPropagation()`, so a click on an arrow or dot never
  navigates.
- The snap track swallows nothing on touch: swiping is native scrolling, and a
  swipe does not fire a click. To stop a drag that ends on the media from being
  read as a tap-through on pointer devices, the media area records pointer-down
  position and cancels the link's default when the pointer moved more than a few
  pixels.
- Controls are `tabIndex={-1}` and `aria-hidden` for keyboard order, so keyboard
  users get one card = one target as required; the full gallery is on the detail
  page.

## 5. Title never falls back to the slug

`ListingCard` renders no headline when the title is empty for the active locale
(falling back to the default locale first, never to `listing.slug`). The title
zone keeps its reserved height so the card still lines up.

Audit result for the same pattern elsewhere — two more places, both on the
listing detail route:

- `src/routes/$locale.immobilien.$slug.tsx:105` — `pickLocalized(title) || listing.slug`
  feeding the page `<title>` and meta description
- `src/routes/$locale.immobilien.$slug.tsx:203` — the same fallback for the H1

The detail page is explicitly out of scope for this task, so the plan reports
them and leaves them untouched; say the word and they go in the same pass.

## Technical notes

- New: `src/components/brand/ListingCardCarousel.tsx`,
  `src/components/brand/ListingCardSpecs.tsx`,
  `src/lib/listings/card-specs.ts`.
- Rewritten: `src/components/brand/ListingCard.tsx` (stays well under 200 lines
  by delegating media and specs).
- `ListingFactPills.tsx` remains for the detail page; the card stops using it.
- New keys in `de.json` and `en.json` under `listings.card.*` (icon labels, "+N
  more photos", previous/next/goto-photo labels). `scripts/check-i18n-keys.mjs`
  must stay green.
- Colours, radii and borders keep using tokens (`bg-card`, `border-border`,
  `rounded-media`, `text-primary`). No hex, no `text-white`.
- Status labels reuse the shipped `listings.reserved` / `sold` / `rented` /
  `coming_soon` keys; the default "for sale, available" state renders no badge.
- No change to the detail page, the admin, the image pipeline or the queries.
