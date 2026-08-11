# AGENTS.md contract + architecture audit

## Part 1 — Write the contract into AGENTS.md

Append the rules below the existing Lovable block at the top of `AGENTS.md` (that block stays byte-identical). Written as imperative rules for the AI, sectioned:

1. **Architecture** — clone-per-client platform: one codebase, one independent deployment, own database and domain per broker. Not a shared backend with thin frontends, not multi-tenant. Reuse comes from the core/brand boundary plus an upstream git template.
2. **Multi-tenant readiness** — read settings through a single accessor (never assume one settings row), express RLS through the existing SQL helper functions (`current_user_role`, `has_role`, `current_user_has_permission`) instead of inline role literals, prefix storage paths by entity id, keep business logic in server functions.
3. **Core/brand boundary** — core (schema, RLS, triggers, `/lib`, `/components/admin`, engines: SEO/head, i18n, energy validation, image pipeline, design tokens) is identical everywhere and updated from upstream; brand (`/components/brand`, route files, `site_settings` rows) is configured or rewritten per client. Brand imports from core; core never imports from brand. No fetching, permission checks or business rules in `/components/brand` — props in, markup out. Route files: composition + head metadata only.
4. **Client data never in code** — strings in `/messages`, values in `site_settings`, optional capabilities behind `feature_flags`, client rows only in `supabase/seed/<client>.sql`. No client name, address, phone or email anywhere else.
5. **Design tiers** — standard tier differentiates via tokens, `homepage_sections` ordering, hero variants and flags with no component rewriting; premium tier may rewrite `/components/brand` and is the priced exception. Default to configuration first.
6. **General** — files under 200 lines, SSR intact, CSS-only animation, latin-ext fonts for umlauts, energy fields driven by `site_settings.country`, cookieless/consent-safe analytics.
7. **Per-client onboarding checklist** — settings rows to fill, assets to upload, locales, country, flags to toggle, seed file to create.

## Part 2 — Audit report (no fixes in this step)

### A. Would break a clone for another client

| File / line | Violation |
|---|---|
| `src/messages/en.json:660`, `src/messages/de.json:660` | `meta_description_solo` hardcodes "Dorothe Waltner" — client name in shared translations |
| `src/messages/en.json:6-7`, `de.json:6-7,39,71` | Region/town names (Saarland, Püttlingen, Völklingen, Saarbrücken, Riegelsberg) baked into core copy and a form placeholder |
| `supabase/migrations/20260724113849_…sql:3-5` | Client bio, credibility heading and `WHERE site_name = 'Immobilienberatung Dorothe Waltner'` inside a core migration — belongs in `supabase/seed/de-waltner.sql` |
| `supabase/migrations/20260803094751_…sql:19` | Absolute per-project storage URL for the client portrait hardcoded in a core migration |
| `src/components/public/PublicChrome.tsx:5-6` | Core shell imports `@/components/brand/SiteNav` and `SiteLogo` — forbidden core→brand direction |
| `src/components/brand/SellerInquiryForm.tsx:4`, `ListingInquiryForm.tsx:4`, `BuyerInquiryForm.tsx:4` | Brand components call server functions (`submit*Inquiry`) and own submit/validation state — business logic in the brand layer |
| `src/routes/$locale.kontakt.tsx` (275 lines) | Route holds form state, opening-hours parsing and page markup instead of composing brand components |
| `src/routes/$locale.immobilien.$slug.tsx` (223 lines) | Route contains layout markup beyond composition |
| `src/routes/__root.tsx:95-97` | Placeholder `"Lovable App"` title/OG defaults instead of `site_settings.site_name` |

Note: type-only imports of `PublicListing` from `@/lib/.../*.functions` in brand components are the allowed direction (brand → core) and are fine.

### B. Maintainability / over 200 lines

- `src/lib/listings/queries.functions.ts` (258), `src/lib/listings/media.functions.ts` (228), `src/components/admin/listings/ImageManager.tsx` (212), `src/components/brand/SellerInquiryForm.tsx` (211).
- Excluded by rule: generated `src/integrations/supabase/types.ts`, `src/routeTree.gen.ts`, unmodified `/components/ui` primitives, SQL migrations and seed files.

### C. Style / tokens

- Hardcoded colours instead of semantic tokens: `brand/Signature.tsx:33`, `brand/HeroFrame.tsx:53-54`, `brand/BrandMark.tsx:26,35`, `brand/Hero.tsx:69,113,118,123`, `brand/ListingGallery.tsx:90,104`, `brand/ListingHeroOverlay.tsx:19,24`, `admin/settings/BrandingPreview.tsx:43` (`text-white`, `bg-black/95`, `bg-white/10`).
- `src/styles.css:12-15` imports Fraunces / Inter / Tangerine directly, so `site_settings.font_heading` / `font_body` cannot actually change typography per client.
- `supabase/functions/process-site-image/index.ts:39` mentions the client portrait filename in a doc comment (cosmetic).

## Deliverable of this step

Only `AGENTS.md` is written. Fixes for section A/B/C are queued as a follow-up so you can pick the order.
