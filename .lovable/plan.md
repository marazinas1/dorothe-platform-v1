# Broker Platform — Architecture Strategy

Decisions taken: clone-per-client now with a multi-tenant-ready core, central updates via a git upstream template, a bespoke brand layer per client, and a module roadmap of KPI dashboard, mini CRM, portal exports, and documents/email automation.

## What the reference projects teach us

**Dharma (split into core API + skin)** — justified there because the backend is a genuine operational engine (availability, pricing, iCal, invoices, contracts, staff app) shared by many hotels, exposed as a versioned REST surface (`/api/public/v1/*`) with hashed API keys, an origin allowlist, rate limiting and request logging. The skin keeps the key server-side only and validates every response with zod.

**OCDG** — a single-client SPA with no reusable core. Fine for a portfolio site, wrong shape for a platform.

**Broker platform** — the shared asset is the *whole application*, and the data is entirely tenant-private. There is no cross-tenant computation to centralise, so a Dharma-style split would add cross-origin admin auth, duplicated image pipelines, two deploys per client and API versioning for a single consumer, with no payoff. Keep one deployable app per client (as today) and get the leverage from a disciplined core/brand boundary plus an upstream sync — not from a network boundary.

## Target architecture

```text
core (identical in every clone, updated from upstream)
  db schema + RLS + triggers      listings, inquiries, profiles, permissions,
                                  site_settings, feature_flags
  server functions (/lib/**)      listings, inquiries, media, analytics, crm,
                                  exports, email
  admin panel (/components/admin) listings, inquiries, team, settings, KPIs
  engines                         SEO/head, i18n, energy validation per country,
                                  image pipeline, design tokens from DB

brand (rewritten per client, no logic)
  /components/brand               hero, cards, sections, nav, footer
  /routes/$locale/*               page composition only
  site_settings rows              colours, fonts, logo, copy, photos
```

Hard rules that make the boundary real:
- Brand files import from core; core never imports from brand.
- No data fetching, permission checks or business rules inside `/components/brand` — they receive props.
- Every client-visible string in `/messages`, every client value in `site_settings`, every optional capability behind `feature_flags`.
- Files stay under 200 lines.

## Multi-tenant readiness without paying for it now

Write the core so a later single-database migration is a refactor:
- Never assume "the one settings row" in application code — read settings through one accessor (`getSiteSettings`) so it can later resolve by host.
- Keep every RLS policy expressed through the existing SQL helpers (`current_user_has_permission`, `has_role`) rather than inline role literals, so a `tenant_id` predicate can be added in one place per table.
- Keep storage paths prefixed by entity id (`listings/<id>/...`), already the case, so a tenant prefix can be added ahead of it.
- Keep all business logic in server functions, never in components — the same functions survive a tenancy change.

## Central update path (upstream template)

- One repository becomes `broker-core-template`; each client repo adds it as an `upstream` remote and merges core updates in.
- Client-specific changes are confined to the brand paths listed above plus `/messages` and DB rows, so merges rarely conflict.
- `AGENTS.md` in the template records the boundary rules and a per-client onboarding checklist (settings rows, assets, locales, country, feature flags).
- A `supabase/seed/<client>.sql` per client keeps a clone reproducible, as `de-waltner.sql` already does.

## Module roadmap (build order)

1. **Finish the current admin core** — listings management polish, inquiries (done), team/users UI, settings modules tab.
2. **KPI dashboard** — listing views, inquiries by source and type, response time, days-on-market, funnel inquiry → viewing → offer → sale, valuation requests. Needs a lightweight `listing_events` table (view/contact) plus aggregation server functions; no third-party analytics required.
3. **Mini CRM / pipeline** — `contacts` and `deals` (or inquiry stages) with notes, follow-up reminders and viewing appointments; inquiries become the intake for it. This is what turns a website into a tool she opens daily and justifies a monthly fee.
4. **Portal exports** — OpenImmo XML feed endpoint under `/api/public/*` (token-protected) for ImmoScout24 / Immowelt / Kleinanzeigen, generated from `listings`, so a property is entered once.
5. **Documents & email automation** — branded transactional emails, auto-reply on inquiry, PDF exposé/brochure generation, seller document handling.

Feature flags gate each module so a cheaper client simply has them off — the same codebase serves several price tiers, which is the recurring-revenue lever.

## Design freedom, given the bespoke brand layer

Each client gets their own `/components/brand`, so Dorothe's logo can drive her palette and Anna Zollner can look entirely different. To keep that affordable: the brand layer only composes core-provided data, tokens still come from `site_settings`, and section on/off order stays in `homepage_sections`. Reverting Dorothe's logo to its original colours and re-tuning the palette around it becomes a brand-layer task, isolated from core.

## What this plan does not do

No code changes yet. Next concrete step, once you approve the direction, is one of: (a) write the core/brand contract into `AGENTS.md` and audit the current codebase against it, (b) start the KPI dashboard with the `listing_events` foundation, or (c) redo the palette around the original logo. Tell me which and I will plan that step in detail.
