<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules — broker platform template

These are binding rules for every task in this repository. Follow them without
being asked. When a request conflicts with a rule, say so and propose the
compliant version.

## 1. Architecture

- This is a **clone-per-client platform**: one codebase, one independent
  deployment per broker. Each client has their own database, domain and
  deployment.
- It is NOT a shared backend with thin frontends, and NOT multi-tenant. Do not
  add tenant ids, tenant routing, or cross-client tables.
- Reuse comes from the core/brand boundary plus an upstream git template — never
  from a network boundary. Do not split the app into separate frontend/backend
  services.
- Fixes that belong to every client go into core so they can be synced upstream.
  Never patch the same bug twice in brand code.

## 2. Multi-tenant readiness (a later move must be a refactor, not a rewrite)

- Read settings only through the single settings accessor
  (`@/lib/config/site-settings.functions`). Never query `site_settings`
  directly from a component, and never assume "the one settings row" in
  application code.
- Express RLS through the existing SQL helper functions
  (`current_user_role()`, `has_role(text[])`, `current_user_has_permission()`,
  `current_user_is_active()`). Never inline role string literals in policies.
- Prefix every storage path with the owning entity id
  (`listings/<listing_id>/...`, `agent/<profile_id>/...`).
- All business logic lives in server functions under `/lib`, never in
  components.

## 3. The core / brand boundary — the most important rule

**CORE** (identical in every clone, updated from upstream):

- `supabase/migrations` — schema, RLS, triggers, SQL helper functions
- `/lib` — server functions, queries, validation, business rules
- `/components/admin` — the whole admin panel
- `/components/ui` — shadcn primitives, never modified
- the engines: SEO/head builder, i18n, energy validation, image pipeline,
  design tokens

**BRAND** (configured or rewritten per client):

- `/components/brand` — presentational components
- route files under `src/routes` — composition only
- `site_settings` rows and `supabase/seed/<client>.sql`

Rules:

- Brand imports from core. **Core NEVER imports from brand.** If a core shell
  needs brand markup, it accepts it as props/children.
- No data fetching, no permission checks, no business rules inside
  `/components/brand`. Brand components receive props and render. Type-only
  imports from core are allowed.
- Route files compose components and build head metadata. No markup or logic
  beyond that — extract both into components.

## 4. Client data — never in code

- Every client-visible string goes in `/src/messages` (`en.json`, `de.json`).
- Every client value goes in `site_settings`.
- Every optional capability sits behind a `feature_flags` row and is read
  through `useFeatureFlag`.
- Client-specific data belongs in `supabase/seed/<client>.sql` only. Migrations
  contain schema, never client content.
- A client's name, address, phone, email, region, town names or any other detail
  must never appear anywhere else in the codebase — including translations,
  comments, placeholders, default values and migration `WHERE` clauses.

## 5. Design tiers

- **Standard tier (default)**: clients differ only through `site_settings`
  tokens (colours, fonts, logo, photos, copy), `homepage_sections` ordering,
  hero variants and feature flags. No component rewriting.
- **Premium tier (exception, priced higher)**: `/components/brand` may be
  rewritten for maximum visual differentiation.
- Always try to achieve differentiation through configuration first, and add a
  variant or token before adding a bespoke component.

## 6. General

- Files stay under 200 lines. Split into components instead of growing one.
  (Generated files — `src/integrations/supabase/types.ts`, `routeTree.gen.ts` —
  and `/components/ui` primitives are exempt.)
- The site is server-rendered. Keep SSR intact; do not move public pages to
  client-only rendering.
- Animation is CSS-only. No motion libraries.
- German market: fonts must include `latin-ext` for umlauts; energy certificate
  fields follow `site_settings.country`; no cookies without consent — prefer
  cookieless, server-side approaches (no Google Analytics by default).
- All colours come from semantic tokens in `src/styles.css`. Never use
  `text-white`, `bg-black`, or hex values in components.

## 7. Per-client onboarding checklist

1. Clone the repository, create a fresh Lovable Cloud backend, apply all
   migrations.
2. Create `supabase/seed/<country>-<client>.sql` and fill the single
   `site_settings` row:
   - identity: `site_name`, `legal_name`, `country`, `currency`, `area_unit`
   - locales: `default_locale`, `enabled_locales`
   - branding: `primary_color`, `secondary_color`, `accent_color`,
     `font_heading`, `font_body`, `logo_url`, `logo_dark_url`, `favicon_url`,
     `og_default_image`
   - contact: `contact_email`, `contact_phone`, `whatsapp`, `address_*`,
     `geo_lat`, `geo_lng`, `opening_hours`, `social`
   - content: `homepage_sections`, `credibility_heading`, `credibility_stats`,
     `about_body`, `qualifications`, `primary_agent_*`
   - legal: `legal_impressum`, `legal_privacy`, `legal_terms`
3. Upload assets to the `site-assets` bucket (logo light/dark, favicon, agent
   portrait, hero image, OG default) and run them through the image
   optimisation function.
4. Set locales and country, then verify energy validation matches that country.
5. Toggle `feature_flags` for the modules sold (rentals, team, valuation,
   sold archive, maps, ...).
6. Create the owner user and grant permissions; confirm the admin panel loads.
7. Confirm no client detail was added outside the seed file and
   `site_settings`.
