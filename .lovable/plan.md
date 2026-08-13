# Homepage rebuild — a block library the settings arrange

The homepage becomes nine core blocks whose order, on/off state and layout live in
`site_settings.homepage_sections`. Nothing client-specific enters component code.

## 1. What `homepage_sections` supports today

Today each entry is `{ key, enabled, variant?, image? }`, with keys
`hero | categories | featured | credibility | sold | about | team | areas | contact`.
Only the hero reads `variant` (`region | property | broker`) and `image`.
The route renders sections in array order and skips `enabled: false`.

### What is added (mechanism kept, extended)

- New keys: `photoband`, `paths`, `valuation`. `categories` is removed from the
  registry (block deleted) — an unknown key is already ignored, so old rows stay safe.
- Hero `variant` gains `text` and `split`; `region | property | broker` are mapped
  onto them so existing client rows keep working (`region`/`property` → `text`
  when no image, `split` when an image exists).
- Generic per-block `image` stays; the photo band uses no image field.
- Default arrangement (used by the seed and by new clients): hero, photoband,
  about, paths, credibility, featured, sold, valuation, contact.

New `site_settings` columns (migration adds schema; the seed carries this client's values):

| column | purpose |
| --- | --- |
| `hero_headline` jsonb | localized client headline |
| `hero_subline` jsonb | localized supporting line |
| `hero_cta_label` jsonb | optional; falls back to a template string |
| `service_areas` jsonb | array of town names she covers |
| `show_sold_prices` boolean, default `false` | price visibility on sold work |
| `valuation_offer` jsonb | localized `{ body, deliverables[], price_note }` |

`qualifications` and `credibility_stats` already exist and now feed the credentials
block (name + meaning per credential). No statistics row anywhere.

## 2. Copy that moves from message files into settings

| moves | why |
| --- | --- |
| `home.hero_line` → `hero_headline` | the headline is this broker's positioning claim, not template wording |
| new supporting line → `hero_subline` | same; it names her market and promise |
| valuation offer wording → `valuation_offer` | what she does, delivers and charges differs per client and per country |
| `home.areas*` town list (derived from listings) → `service_areas` | coverage is a statement about her market, not a by-product of stock |

Everything else — section titles, labels, buttons, tab names — stays in
`en.json`/`de.json` with `{{region}}`/`{{agent}}` interpolation.

## 3. Hero / portrait interlock (one portrait, never twice)

A single resolver in `/lib/homepage/blocks.ts` computes the page plan once, before
render: it reads the hero entry and decides `heroLayout` (`text` | `split`),
`heroImage`, and `aboutShowsPortrait`.

- `split` with no usable image → downgraded to `text` (never a grey box).
- If `heroImage` is the portrait URL (normalized compare with
  `primary_agent_photo_url`), `aboutShowsPortrait = false` and the "Who she is"
  block renders type-only.
- Otherwise the portrait belongs to "Who she is" and the hero never renders it.

Because both blocks read the same computed plan, the two states cannot disagree and
nobody has to change two settings.

## 4. Photo band

- Source: photos of currently published listings (the same public listing data the
  page already loads), one photo per listing first, then additional photos from the
  same listings, so one property can never dominate the strip.
- Uses the small `card` variant crop only; decorative, `aria-hidden`, no links.
- Wants 6–8 crops. With fewer, it renders exactly what exists in a centred,
  evenly-spaced row and does not stretch or repeat; with zero photos the block is
  hidden. Enabled by default when the hero layout is `text`.

## 5. Empty-data behaviour per block

| block | with no data |
| --- | --- |
| Hero | always renders (type-only); `split` degrades to `text` |
| Photo band | hidden when no listing photos |
| Who she is | hidden with no `about_body`; renders type-only without a portrait |
| Two paths | always renders (template copy + routes) |
| Credentials | hidden when `qualifications`/`credibility_stats` are empty |
| Selected properties | hidden when nothing is featured (max 3, `is_featured` only — no "all published" fallback) |
| Recently sold | hidden when no sold/rented listings |
| Valuation | hidden when `valuation_offer` is empty |
| Contact | always renders; details omitted individually when missing |

## 6. Sold work without prices

A `/lib` helper strips the achieved price from a sold listing before it reaches the
card whenever `show_sold_prices` is false, so `ListingCard` stays untouched. Applied
on both the homepage block and `/verkauft`. Town, key facts and the sold/rented
status still show.

## 7. Files

- Migration: new settings columns + defaults; `supabase/seed/de-waltner.sql` gets the
  German/English copy, `service_areas`, the `text` hero, and the stock Unsplash hero
  image and `og_default_image` removed (og falls back to hosting's preview).
- `src/lib/homepage/blocks.ts` — block plan resolver (hero layout, portrait interlock,
  photo band selection, sold-price stripping).
- New core blocks in `src/components/brand/`: `HeroText.tsx`, `HeroSplit.tsx`,
  `PhotoBand.tsx`, `TwoPaths.tsx`, `Credentials.tsx`, `ValuationOffer.tsx`;
  `AboutBroker`, `SoldStrip`, `ContactSection`, `AreaLinks`, `FeaturedListings`
  adjusted; `CategoryGrid` removed from the homepage.
- `src/routes/$locale.index.tsx` — renderer registry updated to the new keys.
- `src/messages/{de,en}.json` — new keys in both files; i18n key check green.
- Contact form defaults to the "Ich verkaufe" tab.

Untouched: `ListingCard`, listings index, detail page, admin.
