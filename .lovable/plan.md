# Language correctness pass + four defects

Two separate language axes, plus four fixes. The listing form structure stays as it is.

## Part 1 — Interface language vs content language

### 1.1 Per-user interface language
- Migration: add `admin_locale text` to `profiles` (nullable, no default). Policy for self-read/self-update expressed through the existing helper functions (`current_user_is_active()`, `auth.uid() = id`), no role literals. A trigger keeps `admin_locale` writable only by the owner, so a user cannot change someone else's.
- The admin gate already loads the caller's profile server-side; it starts returning `admin_locale`, so the interface language arrives with the route context — no extra client round-trip and no flash.
- Resolution order: `profile.admin_locale` → `site_settings.default_locale` → shipped constant fallback. Both profile and settings are loaded in the admin route loader before the shell renders, so there is never a moment where the panel renders in an unresolved language. If a profile has not loaded (unlikely, e.g. settings query failure), the shell renders in `site_settings.default_locale`; it never renders raw keys.
- If `admin_locale` names a language with no message file, it is ignored and treated as null (fall back to default locale). The value is not erased in the database, and the toggle simply shows the resolved language as selected.
- The top-bar toggle writes the choice via a server function in `/lib/auth`, invalidates the profile query, and switches i18next immediately. No navigation, no URL change. Same position in the top bar.
- The offered set is the set of shipped message files (`de`, `en`), taken from one exported constant, not `enabled_locales`.

### 1.2 Distinguish the two controls
- Content tabs in the Texts block get a visible label ("Language of this text" / "Sprache dieses Textes").
- The top-bar control gets an accessible label naming it as the panel/interface language.

### 1.3 Default locale is primary, others optional
- The content tabs open on `site_settings.default_locale` (not `i18n.language`, not the first array element).
- Non-default tabs are marked optional, and the block states plainly that an empty language falls back to the default one — neutral text in muted tone, no warning styling, no incompleteness marker.
- `buildPublishChecklist` already accepts any single translation (`hasAnyTranslation`), so DE-only publishes. Confirmed by reading the code; a unit test locks it in.

### 1.4 Remove the hardcoded English fallback
- `DEFAULT_LOCALE` stays only as a last-resort constant for when settings cannot be read, and is renamed to make that explicit. Every place with access to settings uses `site_settings.default_locale` (root head, i18next fallback chain, admin shell, content tabs).

### 1.5 Fix locales in the right place
- Seed `de-waltner.sql`: `default_locale='de'`, `enabled_locales=ARRAY['de','en']`.
- Follow-up migration neutralising `20260803085652`: it does not touch live values. It only resets the affected columns' **schema defaults** to neutral template values and adds a comment recording that the client values now live in the seed file. Live rows keep whatever the seed sets, so a fresh clone starts neutral and this install stays correct.
- Then grep migrations for remaining client content and list it in chat without fixing it. Already spotted: `20260724113849` (client name + Saarland bio), `20260803090119` (Fraunces font stack), `20260811073823` (client-name `WHERE` clauses).

Out of scope: URL structure / locale prefixes.

## Part 2 — Four defects

### 2.1 Missing translation keys
- Add `admin.listings.help.highlights` and `help.surroundings` to `en.json` and `de.json`.
- Add a build-time check (script run in CI/verification) that extracts literal `t("...")` keys from `src/` and fails when a key is missing from any message file, reporting file, key and missing locale.

### 2.2 Photo reorder
- Drop moves the item **to** the target index (splice out, splice in), not one step toward it.
- The grid keeps a local order state seeded from props: reordering updates the UI instantly, and persistence is debounced (~600 ms) with a single in-flight request, so dragging several photos in quick succession results in exactly one `reorderListingImages` call carrying the final order. A pending save is flushed on unmount/navigation.
- A visible drop indicator (token-based accent line on the target edge) shows where the photo lands.
- Arrow buttons stay and go through the same local-reorder + debounced-persist path.

### 2.3 Objektnummer input
- Add a `reference_code` text input in the section that corresponds to its existing `details` visibility level, with the existing help text. Level unchanged.

### 2.4 Readable publish errors
- A mapper in `/lib/listings` parses the energy validation exception, extracts the field keys, and returns a structured result. The UI renders it with the `admin.listings.energyFields` labels in the interface language ("Publishing needs: Year built (energy certificate)").
- Unmapped errors are shown as a readable sentence ("Publishing failed: …") instead of a raw exception dump, and still logged.
- Label disambiguation only: `year_built` (property) becomes "Year built (property)" / "Baujahr (Objekt)" and `energy.year_built` "Year built (energy certificate)" / "Baujahr (Energieausweis)". Fields are not merged or moved.

## Technical notes
- New/changed files stay under 200 lines; logic goes to `/lib` (locale resolution, key check, error mapping, reorder persistence hook), components only render.
- No hardcoded colours or copy; all new strings land in both message files.
- SSR unchanged; the admin subtree keeps `ssr: false`, public routes keep SSR.
