# Homepage rebuild — person first, evidence after

Seven blocks, a portrait hero, credentials as claims, a compact sold row, a loud
valuation block, and a monochrome logo in the header. Presentation edited in
code (PLAN.md §1); logic in `/lib`; strings in both message files.

## 1. New block order

```text
1 Hero            text + portrait, side by side
2 Two paths       unchanged
3 Why her         her paragraph + three credential claims (one block)
4 Selected        three full cards
5 Recently sold   compact cards, four across
6 Valuation       loudest block after the hero
7 Contact         unchanged
```

Removed: photo band, standalone "Über uns", areas block stays out of the order
list only if it is currently disabled — it is dropped from the homepage set.
`homepage_sections` in the seed is rewritten to exactly these seven keys, and
`AboutBroker` is retired as a homepage block: its paragraph moves into the
credentials block as its opening.

## 2. Hero — split, with the signature under the face

- Seed flips the hero to `variant: "split"` with the portrait as its image, so
  the existing `buildHomepagePlan` picks the `split` layout.
- Text column (7/12): company name small above, headline, supporting line, the
  two existing actions.
- Portrait column (5/12): portrait crop `aspect-[4/5]`, full column width,
  `object-cover object-top`, with `Signature` directly beneath it (the
  signature moves out of the text column in this layout).

**Tablet and mobile.** Side by side holds at `md` and up (768px+). Below that
the grid collapses to one column with the portrait *after* the text — the
headline must still be the first thing read on a phone. At `md` the portrait
narrows to 5/12 of a ~768px viewport, so the crop tightens to `aspect-[3/4]`
between `md` and `lg` to stop it becoming a thin sliver; from `lg` it returns
to `4/5`. Minimum rendered width is never below ~240px, so it never reads as a
small floating square.

**No portrait.** Already handled and stays handled: `normalizeLayout` degrades
`split` to `text` when there is no image, and the hero renders the current
typographic layout with the signature on the actions baseline. Nothing renders
a grey rectangle or a stock photo. Verified in `src/lib/homepage/plan.ts`.

**Portrait interlock.** `buildHomepagePlan` sets `aboutPortrait = null` when the
hero image equals `primary_agent_photo_url`. Since "Über uns" is gone, the
portrait can only appear once anyway; the interlock is kept and re-verified by
comparing the two URLs after the seed change.

## 3. Photo band removed

Delete `src/components/brand/PhotoBand.tsx`, its renderer entry, the
`photoband` seed section, and `photoBandImages` in `src/lib/homepage/plan.ts`.
No replacement imagery.

## 4. Credentials become three claims

New shape, in her language, opening with her own paragraph:

```text
Her paragraph (about_body, lead size, short measure)
──────────────────────────────────────────────────────
[ device ]        [ device ]        [ device ]
Claim heading     Claim heading     Claim heading
Supporting        Supporting        Supporting
sentence          sentence          sentence
Evidence line     Evidence line     Evidence line
──────────────────────────────────────────────────────
quiet membership line
```

- Three claims in a `md:grid-cols-3` grid, each a card-less panel: a rule above,
  generous internal space, no borders between columns on mobile.
- **Graphic device:** a large tabular numeral (01 / 02 / 03) in the heading serif
  at low emphasis, plus a short sage rule above each claim. No icon set is
  introduced — the page's visual language is type, rule and space, and numbering
  reads as an argument in three parts rather than a spec table. (If you prefer
  icons, say so and I will swap the numeral for a thin line-icon trio.)
- Each claim: heading, one supporting sentence, one quiet evidence line naming
  the credential (that is where the certifying body appears — as evidence, never
  as the headline).
- All six claim strings plus the membership line ship as clearly named
  placeholder keys in `de.json` and `en.json` for you to write.
- **Membership line:** one single line, singular wording, naming only the
  Europäische Immobilienakademie. Nothing plural, nothing implying further
  associations.
- The "Nachweise … zur Einsicht vor" line is deleted.
- `src/lib/homepage/credentials.ts` and `CredentialGroups.tsx` (the
  institution/qualification table) are retired; the new block reads its three
  claims from messages and its opening paragraph from `about_body`. Trust seals
  render as before if configured.

## 5. Selected properties — three-line titles

In `ListingCard`, the `large` size title becomes `line-clamp-3` with
`min-h-[3.75em]` (three lines reserved), so a truncating German title gets one
more line and every card in a row still ends at the same height. The `compact`
size keeps two lines. No other change to the card.

## 6. Recently sold — compact variant of the same card

One component, one extra prop path. `ListingCard` already accepts
`size="compact"`; the variant is extended so `compact` also:

- hides the description paragraph,
- uses a shorter media aspect and tighter padding,
- keeps status, town, key figures and the sold date.

`SoldStrip` passes `size="compact"` and switches to a four-across grid
(`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`) with up to four items, and a
quieter heading tier (`text-section-sm`). Prices stay hidden exactly as now
(`soldPricesHidden`, unchanged). No second card component and no copy.

## 7. Valuation — real weight

Keeps its late position and gains emphasis: full-bleed band on the surface
token with the widest break above and below, `text-hero`-adjacent scale for the
heading, the deliverables set at lead size in a short measure, and one large
primary action (the secondary text link is dropped so there is a single ask).

## 8. Logo — monochrome header, original below

- Download the supplied logo from the `site-assets` brand path, and derive a
  one-colour version with a script: keep the alpha channel exactly as it is, set
  every opaque pixel to one dark ink value (the mark's shape is untouched, and
  it is dark-on-light, not a palette recolour).
- Both files live together in `src/assets/brand/`: `logo.png` (original, as
  supplied) and `logo-mono.png` (derived). Swapping either file changes the site
  with no code edit.
- `SiteLogo` gains `variant?: "mono" | "original"` resolved through a tiny
  `src/lib/theme/logo.ts` map, falling back to `settings.logo_url` when a clone
  ships no asset. Header passes `mono`; footer and Impressum pass `original`.

## Technical notes

- Files touched: `src/routes/$locale.index.tsx` (composition only),
  `src/components/brand/Hero.tsx`, `ListingCard.tsx` (title lines + compact
  variant), `SoldStrip.tsx`, `ValuationInvite.tsx`, `SiteLogo.tsx`, a new
  `WhyHer`/credentials block split into small presentational parts, new
  `src/lib/theme/logo.ts`, deletions of `PhotoBand.tsx`, `AboutBroker.tsx`,
  `CredentialGroups.tsx`, `src/lib/homepage/credentials.ts`.
- `supabase/seed/de-waltner.sql` updated for the new `homepage_sections` and the
  split hero. No client data outside the seed.
- Every file stays under 200 lines; existing type tiers and `SECTION_GAP` used
  throughout; SSR untouched; `de.json`/`en.json` kept key-identical so the i18n
  check stays green.
- Untouched: listing detail page, catalogue, admin.
