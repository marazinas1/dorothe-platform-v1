# Listing form: rentals, working order, and a checklist that navigates

## What I found first (the four questions you asked)

**`additional_costs` is dead weight, and I am not reusing it.** It is a
`jsonb NOT NULL DEFAULT '{}'` column on `listings`, passed straight through
`listings_public`. Nothing in the application reads or writes it — no reference
anywhere in `src/`, only in old migrations and seed column lists. All 8 existing
listings hold `{}`. It is a free-form bag from the original schema draft, so it
cannot carry a `CHECK (>= 0)` constraint, cannot back a computed Warmmiete, and
cannot be filtered or sorted on. Nebenkosten and Kaution get real typed columns
instead. `additional_costs` is left untouched (applied migrations are
immutable), simply unused.

**Label switching.** `price` genuinely has two names in German — Kaufpreis and
Kaltmiete — so there are two strings, but only one place decides which is used:
a resolver in `field-visibility.ts` returns the label key for a money field
given the deal type. The admin form, the public detail page and listing cards
all call that resolver; no component contains a `deal_type === "rent"` ternary
around a label. Every other money field has a single label.

**"Provisionsfrei".** A dedicated boolean column `commission_free`
(`NOT NULL DEFAULT false`) — a deliberate answer, distinct from
`commission_value IS NULL` which means "not filled in yet". A checkbox in the
price section; ticking it hides and clears the commission figure fields. The
checklist item is satisfied by either a commission value or the tick, so an
empty commission is never a valid published state while "no commission" is.

**Scroll-to-field from the rail.** Every checklist item carries a stable anchor
id (e.g. `field-title`, `field-energy-year_built`). Fields register that id
through `FieldRow`. One helper in `/lib` resolves it: find the element, walk its
ancestors and open any closed `<details>` on the way, then scroll it into view
and focus the first control inside it. That is what makes the energy year land
on the energy field rather than the property one.

**Existing listings.** Nothing breaks and nothing needs a backfill. The new
money columns are nullable (`NULL` = not stated), the two new booleans default
to `false`, and Warmmiete is a database-computed column derived from figures
that already exist. All 8 current listings are sales, so the rental fields never
appear for them.

## Part 0 — the two leftovers

- A pending photo reorder is flushed instead of dropped: on unmount, on
  navigation away, and before any publish or status change.
- The publish button stays enabled. Clicking it with outstanding items shows the
  blocker list already built for the checklist, and does not call the server.

## Part 1 — rental listings

Money fields become deal-type dependent, driven by the visibility matrix:

```text
sale                          rent
  Kaufpreis (price)             Kaltmiete (price)
  Hausgeld (service_charge,     Nebenkosten (new)
    apartments only)            Heizkosten inklusive (new, yes/no)
  Provision                     Warmmiete (computed, read-only)
                                Kaution (new)
                                Provision
                                Verfügbar ab (availability_date)
```

New columns on `listings`: `utilities_cost`, `deposit`,
`heating_costs_included`, `commission_free`, plus a database-computed
`total_rent` (Kaltmiete + Nebenkosten) that can never contradict its inputs.
Same CHECK discipline as migration `20260811091553`, plus the column grants and
public-view rebuild the anon column-grant model requires.

## Part 2 — section order

Final order: Basics (with the title) → Photos → Price & size → Location →
Equipment → Texts → Energy certificate → More details.

- The title moves to the top of Basics, with every enabled language shown side
  by side, primary first and the others visibly optional. Language tabs stay in
  the Texts block for the long fields.
- Commission moves out of "More details" into the price section, next to the
  figure it relates to, and becomes a checklist item.

## Part 3 — the checklist becomes the navigation

- Sticky side rail beside the form on desktop; on narrow screens it collapses
  into the save bar as an "N items missing" summary that expands on tap.
- Every item is clickable, scrolls to its field and focuses it.
- Every item names the specific missing field, as the energy item already does.
- Done and missing states are visually distinct and calm — a tick versus an
  open marker with the item name carrying the weight, no alarm colours.
- No second section navigation is added.

## Part 4 — smaller fixes

- All money inputs show locale-grouped digits while typing (549.000) and store a
  plain number.
- Photo help text reduced to one line ("optimised automatically, location data
  removed"); the full technical detail moves behind an info affordance.
- The energy `year_built` becomes independently addressable, so the checklist
  jump lands on it and not on the property year.

## Technical notes

Database migration (one migration):

- `utilities_cost numeric`, `deposit numeric` — nullable,
  `CHECK (… IS NULL OR … >= 0)`.
- `heating_costs_included boolean NOT NULL DEFAULT false`.
- `commission_free boolean NOT NULL DEFAULT false`.
- `total_rent numeric GENERATED ALWAYS AS (price + COALESCE(utilities_cost, 0)) STORED`
  — computed in the database so admin and public site cannot disagree.
- Column-level `GRANT SELECT` to `anon` for the new fields on the allow-list and
  `SELECT/UPDATE` to `authenticated`; `listings_public` recreated to expose
  `utilities_cost`, `heating_costs_included`, `deposit`, `total_rent`,
  `commission_free` (commission figures keep their existing
  `commission_note_public` gate).

Code:

- `src/lib/listings/field-visibility.ts` — gains the deal-type axis. Helpers take
  `{ property_type, deal_type }` instead of a bare property type, and expose
  `moneyLabelKey(shape, field)`. All existing call sites (form sections, publish
  checklist, public specs and facts bar) are updated to the shape argument, so
  there stays exactly one source of truth.
- `src/lib/listings/money.ts` — new: grouped-input parsing/formatting.
- `src/lib/listings/publish-checklist.ts` — items gain `anchor` and named
  `missing` fields for every item; new `commission` item.
- `src/lib/listings/scroll-to-field.ts` — new: anchor resolution, opening
  collapsed `<details>`, scroll and focus.
- `src/lib/listings/admin-schema.ts` — the new fields, with `total_rent` read-only.
- Admin components: `PriceGroup` splits into `SalePriceFields`,
  `RentPriceFields` and `CommissionFields`; new `MoneyInput`, `TitleFields`,
  `ChecklistRail`; edits to `BasicsSection`, `FiguresSection`, `ListingForm`,
  `MoreDetailsSection`, `StatusBar`, `SaveBar`, `ImageManager`, `FieldRow`,
  `use-image-order.ts`, `EnergySection`.
- Public side: `ListingFactsBar`, `ListingCard`, `ListingSpecs` read the money
  labels from the resolver and show Nebenkosten, Warmmiete, Kaution and
  provisionsfrei for rentals. SSR stays intact.
- New strings added to both `src/messages/de.json` and `en.json`; the existing
  key check must stay green. Every file stays under 200 lines and all business
  logic lives in `/lib`.
