# Wave one — fix the clone-breaking findings

Three fixes only. Everything else from the audit stays queued.

## 1. Client data out of migrations, into the seed

- `supabase/migrations/20260724113849_…sql`: strip the client bio, the credibility heading and the `WHERE site_name = 'Immobilienberatung Dorothe Waltner'` clause. What remains is not schema at all, so the file is reduced to a no-op comment (kept in place so migration history stays intact) — the `is_featured` demo-listing update also moves out, since it references seed listing ids.
- `supabase/migrations/20260803094751_…sql`: keep the two `site-assets` storage policies (real schema, belongs in core), delete the `UPDATE public.site_settings SET primary_agent_photo_url = 'https://…'` statement with the absolute project URL.
- `supabase/seed/de-waltner.sql` already carries `site_name`, `about_body`, `credibility_heading` and the portrait URL, so nothing is lost. It gains the featured-listing flags that used to sit in the migration.
- The seed stores the portrait as a bucket-relative path (`agent/<file>.avif`); a small core helper resolves it against the current project's public storage URL at render time, so a clone never points at another client's bucket. Absolute URLs already in the DB keep working.
- No "undo" migration is created — the edited files are the fix, and Dorothe's live database keeps its values because those statements already ran.

## 2. Client name and region out of translations

- Add a localized `service_region` value to `site_settings` (migration adds the column, admin General tab gets a field, validation + types updated, seed fills it for the current client). No other place will know a region name.
- Message files use interpolation instead of literals:
  - `home.title` → "Real estate in {{region}}" / "Immobilien in {{region}}"
  - `home.description` → wording built around `{{cities}}`, with the city list derived from live listings (same `publicCitiesQueryOptions` the areas section already uses) and a region-only fallback when no listings exist yet
  - `pages.listings.description` → uses `{{region}}` (also removes the stale "Aichfeld region" leftover)
  - `pages.about.meta_description_solo` → uses `{{agentName}}` from `site_settings.primary_agent_name`, falling back to `site_name`
  - `listings.filters.city_placeholder` → generic placeholder, with the example town taken from the first derived city when one exists
- Route `head()` builders pass the interpolation values from loader data; the city list is already fetched on the homepage and gets added to the listings-index loader.

## 3. Make fonts genuinely configurable

- Add `src/lib/theme/fonts.ts`: a core registry mapping supported font keys to their CSS font-family stack, with heading / body / script roles marked and every entry shipping `latin-ext` for umlauts.
- `src/styles.css` imports the whole registry's `@fontsource` files (bundled, self-hosted, no CDN) instead of assuming one client's three fonts. A couple of additional families are installed so the standard tier has real choice.
- `ThemeStyleTag` resolves `site_settings.font_heading` / `font_body` through the registry to a full stack (unknown value falls back to the neutral default) and emits the CSS variables, so changing the setting actually changes typography.
- Admin Branding tab: the two font fields become selects driven by the registry, so a client can only pick a font that is actually bundled.
- Registry stays curated: five families total — two serif/display heading options, two sans body options, one script for the signature motif.
- Page-weight check: declaring a family only adds its `@font-face` rules to the bundled CSS (a few hundred bytes each, gzipped). Browsers fetch a `.woff2` file only when a rendered element actually resolves to that family, so unselected families are never downloaded. The extra choice costs CSS bytes, not font bytes — and no `preload` links are added for registry fonts, which would break that guarantee.

## 4. Root head defaults (live bug)

`src/routes/__root.tsx` falls back to `"Lovable App"` for `title`, `og:title` and `twitter:title`, so any share of the live site that renders before settings resolve shows a Lovable placeholder. Replace with `site_settings.site_name` resolved in the root, and a neutral non-placeholder fallback if settings are unavailable. Per-route `head()` values continue to override these.

## Out of scope for this wave

Core→brand import in `PublicChrome`, inquiry-form logic in the brand layer, oversized route/lib files, `text-white` / `bg-black` token violations.

## Technical notes

- The `service_region` column is a localized JSONB (`{"de": …, "en": …}`) like `about_body`, read via the existing settings accessor and localized with the same helper used for other JSONB copy.
- Migration edits touch only already-applied statements, so no re-run happens on this database; a fresh clone gets clean schema plus the chosen seed.
- Root head defaults stay sitewide-only (no canonical, no `og:image`), matching the existing comment in `__root.tsx`.
- Verification: build + typecheck, then load `/en` and `/de`, the listings index and the about page to confirm titles, descriptions, placeholder and portrait all render from settings; inspect the served HTML for the root title and the network panel to confirm only the selected font files download.

