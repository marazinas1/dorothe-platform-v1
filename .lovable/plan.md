# Language correctness pass + four defects (revised)

Two separate language axes, plus four fixes. The listing form structure stays as it is.

## Part 1 — Interface language vs content language

### 1.1 Per-user interface language
- Migration: add `admin_locale text` to `profiles` (nullable, no default). **No new RLS policy.**
- Writes go through one server function in `/lib/auth` under `requireSupabaseAuth`, which updates `admin_locale` for `auth.uid()` and no other column. It validates the value against the shipped message-file set and rejects anything else.
- Reads: the existing admin gate already loads the caller's profile server-side; it starts returning `admin_locale`, so the interface language arrives with the admin route context — no extra round-trip.
- Resolution order: `profile.admin_locale` → `site_settings.default_locale` → shipped constant. Both profile and settings are resolved in the admin route (`beforeLoad` + loader) before the shell renders, so the panel never renders in an unresolved language and never shows raw keys. If settings fail to load, the shipped constant is used.
- An `admin_locale` naming a language we have no message file for is ignored and treated as null (falls back to `default_locale`). The stored value is not erased; the toggle shows the resolved language as selected.
- The offered set is the shipped message files (`de`, `en`) from one exported constant — not `enabled_locales`.
- Toggle stays in the same top-bar position; it writes, invalidates the profile, and switches the admin i18n instance immediately. No navigation, no URL change.

**Existing defect, reported not silently used:** `profiles` already has a broad self-update policy — "Users can update own profile" (`FOR UPDATE USING (id = auth.uid())`) from migration `20260723133630`. Column-level escalation is currently only blocked by the `profiles_enforce_role_integrity` trigger, not by the policy. I will not rely on or widen it; the toggle uses the server function. Tightening or replacing that policy is a separate task — flagging it as requested.

### 1.2 Admin gets its own i18n scope
`src/routes/$locale.tsx` currently wraps everything, including `/admin`, in `<I18nProvider locale={URL locale}>`, and `getI18n` is a singleton that calls `changeLanguage` globally — so a profile-set admin language would be reverted on the next navigation.

- `src/i18n/config.ts` gains a second, named i18next instance (`createInstance`) for the admin, independent of the public singleton. The public site keeps using the URL locale; the admin uses the resolved interface locale.
- The admin route renders its own provider with that instance, inside/over the `$locale` provider, so navigation within `/admin` cannot revert it (the public instance changing language no longer affects the admin instance).
- Admin components stop using `i18n.language` for routing:
  - `ListingForm` post-save navigation and any other in-admin navigation use the route's own `locale` param (`useParams`).
  - `StatusBar` public link and `PreviewButton` use `site_settings.default_locale`, so a preview shows the site's primary language regardless of panel language.

### 1.3 Distinguish the two controls
- Content tabs in the Texts block get a visible label ("Language of this text" / "Sprache dieses Textes").
- The top-bar control gets an accessible label naming it as the panel/interface language.

### 1.4 Default locale is primary, others optional
- Content tabs open on `site_settings.default_locale`, always.
- Non-default tabs are marked optional, and the block states that an empty language falls back to the default one — muted, neutral copy; no warning styling, no incompleteness marker.
- `buildPublishChecklist` already accepts any single translation (`hasAnyTranslation`), so DE-only publishes; a unit test locks that in.

### 1.5 Remove the hardcoded English fallback
`DEFAULT_LOCALE` stays only as a last-resort constant (renamed to say so) for when settings cannot be read. Root head, i18next fallback chains, admin shell and content tabs all take `site_settings.default_locale` where a real setting is available.

### 1.6 Fix locales in the right place — and truly neutralise the migration
- Seed `de-waltner.sql`: `default_locale='de'`, `enabled_locales=ARRAY['de','en']`, plus the colour, font and `homepage_sections` values that migration `20260803085652` was carrying (some already present there; the rest move in).
- `20260803085652` is an unconditional `UPDATE public.site_settings SET ...`, so column defaults are irrelevant. The follow-up migration therefore **UPDATEs the same columns back to neutral template values** (`default_locale='de'` as the schema's own neutral default, `enabled_locales=ARRAY['de']`, null/neutral colours and fonts, the neutral `homepage_sections` template order) and documents that client values live in the seed file. Migrations run in order, so on a fresh clone the neutral values win, and the seed — which runs after migrations — applies the real client configuration.
- **Effect on this live database:** the follow-up migration will overwrite live values that are currently correct (colours, fonts, homepage sections, locales). Immediately after it runs, `supabase/seed/de-waltner.sql` must be re-applied against this database to restore them. I will run the follow-up migration and then re-apply the seed in the same step, and verify the public site's colours, fonts, homepage order and locales afterwards. Nothing outside `site_settings` is touched, so listings, photos and users are unaffected.
- Then grep migrations for other client content and list it without fixing: `20260724113849` (client name + regional bio text), `20260803090119` (client font stack), `20260811073823` (client-name `WHERE` clauses).

Out of scope: URL structure / locale prefixes.

## Part 2 — Four defects

### 2.1 Missing keys + a check that catches dynamic keys
- Add `admin.listings.help.highlights` and `help.surroundings` to `en.json` and `de.json`.
- A verification script (run as part of the build/verify step) walks `src/` and checks two kinds of `t()` calls:
  - **Literal keys** — verified directly against every message file.
  - **Template-literal keys** — the interpolated variable is resolved against the constant that feeds it (e.g. `EDITABLE_CONTENT_SECTIONS`, deal types, selectable property types, `ChecklistKey`, status values, price periods, commission types, energy field keys). Every expanded key is then checked in every message file. The prefix→value-set mapping lives in one registry module next to the script.
  - Any `t()` call the script cannot resolve statically **fails the check** with instructions to register its value set. Skipping is never silent — that is exactly what let `help.highlights` through.
- The script reports file, line, key and the locale(s) missing it.

### 2.2 Photo reorder
- Drop moves the dragged item **to** the target index (splice out, splice in), not one step toward it.
- `ImageManager` keeps a local order state seeded from props. Every reorder path — drag-drop, arrow buttons and `makeCover` — mutates that local order first and goes through one shared debounced persist (~600 ms, single in-flight request, latest order wins), so several moves in quick succession produce exactly one `reorderListingImages` call. `makeCover` no longer calls the server directly, so it cannot race a pending save. A pending save is flushed on unmount/navigation and before publishing.
- **Refresh vs pending save:** a `dirty` flag is set on the first local change and cleared only after the persist resolves. While it is set, incoming props are ignored — the local order stays authoritative, so a `refresh()` (or a poll from image processing) cannot revert a drag mid-flight. New/removed images are still reconciled by id: unknown ids are appended, missing ids dropped, existing order preserved. Once the save resolves and the refetch returns, props take over again.
- A drop indicator (token-based accent line on the target edge) shows where the photo lands. Arrow buttons stay as the keyboard-accessible fallback.

### 2.3 Objektnummer input
Add a `reference_code` text input in the section matching its existing `details` visibility level, with the existing help text. The level is not changed.

### 2.4 Readable publish errors
- A mapper in `/lib/listings` parses the energy validation exception, extracts the country and field keys, and returns a structured result. The UI renders it with `admin.listings.energyFields` labels in the interface language ("Publishing needs: Year built (energy certificate)").
- Unmapped errors are shown as a readable sentence ("Publishing failed: …"), still logged, never as a raw exception dump.
- Label disambiguation only: property `year_built` → "Year built (property)" / "Baujahr (Objekt)"; `energy.year_built` → "Year built (energy certificate)" / "Baujahr (Energieausweis)". Fields are not merged or moved.

## Technical notes
- Files stay under 200 lines; logic lives in `/lib` (locale resolution, key-check registry, error mapping, reorder persistence hook); components render.
- All new strings in both message files; tokens only, no hardcoded colours.
- SSR unchanged: the admin subtree keeps `ssr: false`, public routes keep SSR.
