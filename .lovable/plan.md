# Homepage hierarchy (PLAN.md 7.2)

Right now every block on the homepage is set at the same weight: nine sections,
each opening with a `text-4xl/6xl` heading, each separated by exactly `mt-40`,
each on the same 1400px container. Scrolling gives no signal about what matters,
and the credentials are stated twice — four large institution names
(`credibility_stats`) followed by a qualifications list naming the same
institutions again.

This pass changes weight, rhythm and the credentials block. Nothing else.

## The hierarchy we commit to

Four tiers, applied consistently:

1. **Hero** — largest type on the page. Unchanged in size; only the right side
   of the text layout gets resolved so the composition looks chosen.
2. **Valuation** — the block that earns the mandate. Becomes the second-loudest
   thing on the page: full-bleed accent panel, section heading one step below
   the hero, the deliverables list framed rather than a plain row of borders,
   and the CTA as the only large button below the hero.
3. **Supporting blocks** (property grid, sold, credentials, two paths) —
   one step quieter: smaller headings, an eyebrow instead of a display heading
   where the block is evidence rather than an argument.
4. **Quiet blocks** (photo band, areas, contact) — smallest headings, tightest
   type.

## Density, deliberately varied

- Text sections breathe: wider vertical padding, narrower measure, larger
  leading.
- The property grid tightens: less space between heading and grid, smaller
  gutters, so three cards read as one object instead of three sections.
- Section separation stops being one constant. Three rhythm steps — a major
  break before an argument block, a normal break, and a tight break between two
  blocks that belong together (property grid → sold, credentials → seals).

## The credentials fix

One block, one heading, no institution named twice:

- The four named institutions stay as the emphasis row (this is the answer to
  "will she know what my house is worth").
- Qualifications that merely repeat an institution already shown in that row are
  dropped from the list; the remaining qualifications render as a quieter
  supporting line, not a second full-weight section with its own headline.
- Seals attach to the same block instead of standing alone.
- The de-duplication is a rule, not a hand edit: it lives in `/lib` and works on
  whatever any client puts in `site_settings`, so a clone with different
  institutions behaves the same.

## Hero right side

In the text layout the right column is currently empty and the signature sits on
the bottom border. It gains a deliberate right-hand anchor: the signature plus
the primary credential line, aligned to the actions' baseline, so the empty area
reads as composition rather than leftover space.

## Technical notes

- New type utilities in `src/styles.css` (`text-section`, plus a lead and a
  minor step) so heading weight is a named tier, never an ad-hoc `text-6xl` in a
  component. All sizes stay derived from the existing font tokens.
- New `src/lib/homepage/rhythm.ts` exporting the three spacing steps, and each
  brand block takes its spacing from there instead of a literal `mt-40`.
- New `src/lib/homepage/credentials.ts` — merges stats, qualifications and seals
  into one resolved shape and drops the duplicates. `Credentials.tsx` renders it;
  `QualificationsList.tsx` becomes the quieter supporting list.
- Grid density: `LISTING_CARD_GRID` in `src/lib/homepage/card-grid.ts` tightens
  its gutters. It is the single grid definition, so homepage, catalogue and sold
  page stay identical — this is the one shared value that changes.
- Files touched: `src/styles.css`, `src/lib/homepage/{rhythm,credentials,card-grid}.ts`,
  and the brand blocks `Hero`, `ValuationInvite`, `Credentials`,
  `QualificationsList`, `CredibilityBar`, `TrustSeals`, `FeaturedListings`,
  `SoldStrip`, `AboutBroker`, `TwoPaths`, `PhotoBand`, `AreaLinks`,
  `ContactSection`.
- No colour, hex or font literals — tokens only. No new client data, no
  translation-key removals; any new label goes into both `de.json` and `en.json`.
- Not touched: `ListingCard`, the listings index, the detail page, the admin,
  navigation, the seed files, or `homepage_sections` order.

## Open question

`homepage_sections` currently places `valuation` second-to-last, after both
property blocks. Making it the most resolved block after the hero argues for
moving it above `featured`. That is seed/settings data, not code — say the word
and I will move it in the same pass; otherwise the order stays as configured.
