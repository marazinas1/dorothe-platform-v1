# Broker Platform — Context and Plan

Handoff document for working directly with Lovable.
Paste the relevant section as context at the start of a session.

Last verified against `marazinas1/dorothe-platform-v1` on 2026-08-13.

---

## 1. What this project actually is

This is the **first site in a portfolio of broker websites**. Dorothe
Waltner is client one. The next client is cloned from this repository and
adapted.

Cloning is the customisation mechanism. That means editing code for a new
client is normal and expected — it is not a failure of abstraction. Do not
turn every difference into a setting.

Two layers, treated differently:

**Presentation — free to change per client, in code.**
Texts, colours, fonts, imagery, page set, navigation, homepage blocks,
section copy. A new client gets whatever suits them, edited directly. Do not
add configuration switches for things one client wants.

**Core — shared, and where the real work lives.**
The listing data model, statuses and status flow, publish rules, energy
validation for DE/AT/CH, field visibility by property and deal type,
permissions and RLS, the image pipeline, the inquiry model, the admin
editor, the dashboard. Bugs here are expensive and repeat across every
clone. Changes here need care and should stay client-agnostic.

The one rule that survives regardless of layer: **no client data in
migrations.** Client values belong in `supabase/seed/<client>.sql` and in
`site_settings`. A migration carrying one client's colours will silently
overwrite the next client's. This has already happened once and needed a
neutralising migration.

This is not a SaaS product and should not be built like one. If a future
decision depends on "what would the next broker want", the answer is
usually: the next broker gets their own edit.
## 2. The business thesis behind the design

A solo broker's website is not a listings board.

Buyers arrive from portals and Google straight onto a listing page — they
rarely see the homepage. Owners considering a sale are the audience the
homepage exists for. A buyer enquiry is a share of one commission; an owner
mandate is the commission **plus** a property to sell.

So:

- **Homepage = for sellers.** Convince an owner to trust this broker.
- **Listing pages = for buyers.** Serve someone who already arrived.
- **Listings on the homepage are evidence, not a catalogue.** Three, never
  all. The catalogue lives at `/immobilien`.
- **Sold work is the strongest proof a broker has**, but achieved prices are
  hidden by default — German sellers do not expect the price they accepted
  to be published beside photographs of their house.

Dorothe's real differentiator: she is a **certified valuer**, not only an
agent (IHK, DEKRA, Sprengnetter, EIA). That answers the owner's real
question — "will she know what my house is worth". Her Sprengnetter
inheritance-law qualification is an unexploited niche (Erbengemeinschaft,
Erbschaftssteuer, Verkehrswertgutachten) and likely the best-converting page
the site could have.

---

## 3. Architecture rules that must not be broken

Read `AGENTS.md` in the repo first. The rules that get violated most often:

1. **Clone-per-client.** Not multi-tenant. Each client gets their own
   database and deployment.
2. **No client data outside the seed file.** Client values in a migration
   follow every clone. This has already happened once and needed a
   neutralising migration. Client content lives in
   `supabase/seed/<client>.sql` and in `site_settings`.
3. **One design system** shared between public site and admin. Tokens, never
   hardcoded colours or fonts.
4. **Business logic in `/lib`.** Components render.
5. **Files under 200 lines.**
6. **SSR intact on public routes.** The admin subtree stays `ssr: false`.
7. **Every string in both `de.json` and `en.json`.** The i18n key check must
   stay green — it now fails on any `t()` call it cannot resolve statically,
   including helper-built keys.
8. **`listings_public` is the only public door.** `anon` has no access to
   the raw `listings` table. Do not add column grants to it.

---

## 4. The two language axes (settled — do not re-litigate)

These are unrelated and must stay unrelated:

| | Interface language | Content language |
|---|---|---|
| Who | whoever operates the panel | whoever reads the site |
| Stored in | `profiles.admin_locale` per user | `site_settings.enabled_locales` |
| Dorothe | German | German |
| Marius | English | German (pasted in) |

- Admin interface language is a **per-user preference**, never from the URL.
- Site content language is a **per-client setting**.
- German is primary, English optional. An empty English field is a valid,
  finished state — the German text is shown.
- Structured values (features, condition, heating, energy sources, statuses)
  translate for free through the message files. Only four fields are free
  text: Titel, Beschreibung, Highlights, Lage & Umgebung.
- **No automatic translation.** Considered and rejected: on-the-fly
  translation is invisible to Google, which destroys the SEO argument that
  justifies the site. If it is ever added, it happens once on save, stored,
  editable, with a staleness check against the German text.

---

## 5. Current state — what is done

**Admin listing editor**
- Section order: Basics · Preis & Größe · Lage · Ausstattung · Texte ·
  Energieausweis · Mehr Details · Fotos (last, so the photo grid never
  splits the form)
- Sections numbered from render order
- Sale/rental conditional money fields; `total_rent` is a generated column,
  NULL for non-rentals; `commission_free` is a deliberate boolean distinct
  from "not filled in"
- Sticky publish checklist rail that names the missing field and scrolls to
  it, opening collapsed sections on the way
- Photo reorder by pointer events (works on touch), local order with
  debounced persist, flushed on unmount
- Money formatted and parsed with the **site** locale, never the operator's
- Country is an ISO code, DACH set only
- Under each text field, a line saying where it appears publicly, plus a
  small diagram of the public page

**Admin listings index**
- Status control on the card: draft, coming_soon, active, reserved, sold,
  rented, archived. Filtered by deal type — a sale can never become
  `Vermietet`
- No separate "published" flag. Visibility derives from status
- Grouped by status when unfiltered, flat when filtered

**Admin dashboard**
- Work queue, not a metrics wall: unhandled enquiries (`new` + `read`,
  oldest first, overdue after 24 h) · cannot be published · published with
  gaps · reserved · long online without an enquiry
- Gap rules live once in `src/lib/listings/published-gaps.ts`; count and
  items come from the same filtered array
- Figures below with a period filter
- `Ø Bearbeitungszeit` is labelled as time-to-processing, not response time,
  because it measures when someone clicked "handled" in the panel
- Designed empty states — an empty group reads as achieved, not blank

**Public site**
- Homepage rebuilt as a block library arranged by
  `site_settings.homepage_sections`: hero (text/split) · photo band ·
  who she is · two paths · credentials · selected properties · recently
  sold · valuation offer · contact
- Legal pages `/impressum`, `/datenschutz`, `/agb` exist and are linked in
  the footer; content from `site_settings`, empty state says so plainly
- Consent checkbox on all four public forms, recording `consent_at` and
  `consent_privacy_version`
- Server-side listing view counting: no cookies, no IP, no identifiers, bots
  and admin previews excluded, no double count between SSR and client
  navigation

---

## 6. Known defects and open items

| Item | Detail |
|---|---|
| Map tiles | `src/lib/maps/carto.ts` loads `basemaps.cartocdn.com`. Lovable's last report claimed OpenStreetMap — that is wrong. Visitor IP reaches CARTO. Decision pending: declare it, click-to-load, or self-host. Recommendation: click-to-load plus declare. |
| Sprengnetter seal | Switched off via settings. Mechanism kept. |
| `inquiry_count`, `view_count` | `inquiry_count` is dead and stays dead. `view_count` is now written. |
| Logo | The orange bar in the "4 Wände - Saar" logo is the only saturated colour and fights the olive/cream palette. Needs a conversation with the client, not a code change. |
| Listing content | Several listings still have wrong or missing data. Being handled separately, does not block structural work. |
| `service_areas` | Currently seeded; needs the client's real coverage areas. |

---

## 7. The work plan, in order

### 7.1 Navigation and page map — DO THIS FIRST

Current menu: Angebote · Verkauft · Immobilienbewertung · Über mich ·
Kontakt.

This is not settled and everything else builds into it. Decide the page set
a **broker template** should have, not what Dorothe happens to need. Likely
additions: an inheritance/Erbrecht page, a "how selling works" page, and a
content section in the admin so a broker can edit their own page text
without going into Settings.

Do not build pages before the map is agreed.

### 7.2 Homepage hierarchy

The page currently has no hierarchy — every section is the same weight, so
nothing reads as important. Specific problems:

- Credentials are said twice: four large names (IHK, DEKRA, Sprengnetter,
  EIA) and then a "Qualifikationen" list repeating the same institutions.
  Merge into one block.
- The valuation block is the money block and is visually weaker than the
  credentials list.
- "Who she is" text is set at nearly headline size and competes with the
  hero; the portrait is small while the text is large — backwards for a
  block whose job is to show a face.
- Hero: right side still empty; the composition must look chosen, not left
  over.
- Vertical rhythm between sections is inconsistent.

### 7.3 The listing card

It appears on the homepage, the catalogue and the sold page, so it is built
once, deliberately.

- Equal height regardless of content: fixed image aspect, clamped title and
  description zones, reserved space for the spec row even when empty, price
  pinned to the bottom
- Icons instead of text labels for area, bedrooms, bathrooms, rooms
- Photo carousel on the card with dot indicators, swipeable
- Status badge
- The title must never fall back to the slug — currently
  `pickLocalized(title) || listing.slug`, which put `apartment-d680` on a
  public page

### 7.4 The listing detail page

Target structure, drawn from what German buyers expect:

Gallery → key facts → description → full specification → features →
location and map → floor plans → energy certificate → documents →
enquiry form → related properties

### 7.5 Media types — floor plans, tours, documents

The database already supports all of this and the admin cannot reach any of
it:

- `listing_images.is_floorplan` and `is_visualization` — no UI
- `listing_tours` (`matterport`, `youtube`, `vimeo`, `360`) — no UI
- `listing_documents` — no UI

Requirements: floor plans excluded from the gallery and shown full width in
their own block; tours pasted as a URL with the type detected, embedded only
on click; Matterport links copied out of ImmoScout24 are base64-wrapped in a
`tourId` parameter and must be accepted in that form.

### 7.6 Interior pages

Bewertung (with the full valuation intake form), Über mich, Erbrecht.

### 7.7 URL structure — before launch

German as default locale without a prefix (`/immobilien`), English prefixed
(`/en/immobilien`), `/de/*` permanently redirected, hreflang and canonical
per page, sitemap covering both, admin and auth dropping the locale segment
entirely.

Slug rules are already correct: built from the title, frozen once the
listing has been public, manual override available, old slugs redirect.

### 7.8 Analytics page

Currently a stub. Build only after view data has accumulated.

Dashboard answers "what needs me today" — no time axis, with actions.
Analytics answers "how is the business going" — time axis, no actions. If a
number has no time axis it belongs on the dashboard.

Content: Vermarktungsdauer (`published_at` → `sold_at`), asking price vs
achieved price, enquiries over time by type, enquiries per listing, and —
once there is data — views and the views-to-enquiry conversion, which is
what separates a pricing problem from a visibility problem.

The first two are Dorothe's own sales pitch to the next owner: "I sell in X
days at Y% of asking." The platform generates her sales evidence.

### 7.9 Launch checklist

- Legal texts supplied by the client and pasted into Settings → Legal
- Map decision implemented
- `service_areas` set to real coverage
- Stock photography gone (already removed from the hero and og:image)
- Staging on `dorothe.stagehomy.com` with `noindex` before the client's own
  domain
- Footer credit "designed by StageHomy"

---

## 8. How to work with Lovable on this

What has worked, repeatedly:

- **Plan mode for anything structural.** Review the plan, correct it, then
  approve. Several real defects were caught at plan stage.
- **Say why, not only what.** Explaining the reason produces better
  solutions than specifying the implementation — twice Lovable found a
  better answer than the one proposed.
- **Ask it to verify before changing.** "Tell me what you actually found"
  has repeatedly overturned a wrong hypothesis.
- **Require a report with specifics**, then check the report against the
  code. Reports have been accurate roughly four times out of five; the fifth
  matters.
- **Name what must not change.** Without it, unrelated working code gets
  touched.
- **Ask for the trade-offs before deciding**, for anything with a cost.

Recurring failure modes to guard against:

- A rule implemented twice (once in SQL, once in TypeScript) — they drift
- Reports claiming something that is not in the code
- Plan items silently dropped during the build
- Metrics displayed for columns nothing writes
