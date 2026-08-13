# Admin dashboard: work queue first, honest metrics second

## What I verified before planning

- **`listings.view_count` is dead.** Nothing writes it: no trigger on `listings`, no RPC, no update in `src` (only references are the column definition, the "omit from the public view" comment, and the admin write-blocklist in `admin-mutations.functions.ts`). Every row is 0. I will **not** display it and will **not** add page-view tracking (that is a separate GDPR decision).
- **`listings.inquiry_count` is also dead.** `inquiries` has zero non-internal triggers, and no code increments it. Every row is 0. It stays dead — no backfill, no half-maintained counter. The "no enquiries" queue group counts real rows in `inquiries`.
- **Rentals already have a transaction timestamp.** `listings_enforce_status_flow` sets `sold_at := now()` for `status IN ('sold','rented')`, so the sold/rented metric uses `sold_at` for both and never touches `updated_at`. No new column needed. (Correction 2: chose the existing timestamp; the metric stays sales + rentals, split by `deal_type`.)
- **Marking an enquiry handled is a step someone must remember.** Opening a detail page auto-sets `read`; `handled` only happens when the user clicks "Als bearbeitet markieren" in `InquiryDetail`. Nothing else sets it — no reply action, no automation. So the processing-time metric measures panel discipline, and it is labelled as such. I am not redesigning that screen here.
- Current data (for empty-state realism): 9 listings — 5 active, 2 sold, 2 drafts; 0 reserved; 8 of 9 without map coordinates; 1 active listing without description; 1 enquiry total, 0 new.


## Part 1 — Work queue

Five groups in fixed order, each with its own query, its own loading state, and item-level deep links using the existing `scrollToField` anchors (`/$locale/admin/listings/$id` + `?field=<anchor>` read on mount, so "energy certificate incomplete" lands on the energy field).

1. **New enquiries** — `inquiries` where `status = 'new'`, ordered `created_at ASC` (oldest first), `limit 8`, with a separate exact count. Shows name/email, listing title or the `type` (listing/buyer/seller), and waiting age; items older than 24 h get an accent-toned "overdue" marker. Always first.
2. **Cannot be published** — drafts whose publish checklist has outstanding items, each naming the missing fields.
3. **Published with gaps** — live listings that work but underperform; the concrete gap is named, no score.
4. **Reserved** — `status = 'reserved'`, ordered by `updated_at ASC`, showing how long they have been reserved.
5. **Long active, no enquiries** — `status = 'active'`, `published_at < now() - 90 days`, zero rows in `inquiries` for that listing.

### Exact queries and bounds

All run inside one admin-gated server function file, as the signed-in user (RLS applies), through SQL — no "select all, count in JS".

| Group | Query | Bound |
|---|---|---|
| New enquiries | `select id,type,name,email,created_at,listing_id,listings(slug,title) from inquiries where status='new' order by created_at asc limit 9` + `select count(*) head` | 8 shown, 9th row proves "more"; count exact |
| Cannot be published | `select <checklist columns>, listing_images(...) from listings where status in ('draft','coming_soon') order by updated_at desc limit 25` then checklist filter | 25 candidate rows max, 8 rendered, remainder as "+N more" |
| Published with gaps | one Postgres RPC `admin_listing_gaps(_limit int)` returning id, slug, title, and boolean gap flags, computed in SQL; `where status in ('active','coming_soon') and (any gap)` order by `updated_at desc` | `limit 9`, plus exact count in the same RPC |
| Reserved | `select id,slug,title,updated_at from listings where status='reserved' order by updated_at asc limit 9` | 8 shown + count |
| Long active, no enquiries | same RPC family: `admin_stale_active(_days int, _limit int)` — `left join inquiries i on i.listing_id=l.id`, `having count(i.id)=0`, `published_at < now() - interval` | `limit 9` + exact count |

Drafts are few by construction (junk-draft cleanup already runs), so the checklist group can safely fetch a bounded candidate set and evaluate in TypeScript — this is what keeps it from disagreeing with the editor.

### Where the rules live

- **Publish blockers**: `buildPublishChecklist` only, reached through the existing `rowPublishBlockers(row, country)` in `src/lib/listings/row-publish-check.ts`. The dashboard calls that same function with the same row shape the listings index uses. No second implementation.
- **Published-with-gaps rules**: new single-source module `src/lib/listings/published-gaps.ts` exporting `PUBLISHED_GAP_KEYS` and `publishedGaps(row): GapKey[]`, where a gap is:
  - `map` — `geo_lat` or `geo_lng` null
  - `description` — no non-empty description in any locale
  - `reference` — `reference_code` empty
  - `photos` — fewer than 5 images
  - `title` — no non-empty title in any locale (a published listing with no title is a gap, not a blocker, since it is already live)

  Each gap key maps to a form anchor in the same module, so the editor's checklist rail and the dashboard read one table. The SQL RPC mirrors these predicates for the *bounded selection*; the *rendered gap labels* come from `publishedGaps()` on the returned rows, so the displayed truth is always the TypeScript rule.

## Part 2 — Metrics

One period control (presets: 7 days, 30 days, 90 days, this year, custom range) drives every number. Selection lives in route search params so a reload keeps it.

- Active listings by status (all statuses, counted in SQL, `group by status`)
- Enquiries received in period, split by `type`
- Sold / rented in period (`sold_at` within range; `rented` by `updated_at` within range for rentals)
- Average response time: `avg(handled_at - created_at)` over enquiries with `handled_at` in the period, shown as a plain duration ("Ø 4 Std. 12 Min., über 3 bearbeitete Anfragen") with the sample size, never a grade

All four come from one RPC `admin_dashboard_metrics(_from timestamptz, _to timestamptz)` returning a single JSON row — one round trip, all aggregation in Postgres.

Not built: revenue/commission, occupancy/booking metrics, view counts.

## Part 3 — Empty states, in words

- **New enquiries empty**: "Keine unbeantworteten Anfragen." with a quiet check mark — reads as achieved, not blank.
- **Cannot be published empty**: "Alle Entwürfe sind vollständig." (or, with no drafts at all, "Keine Entwürfe offen.")
- **Published with gaps empty**: "Alle veröffentlichten Objekte sind vollständig."
- **Reserved empty**: "Keine reservierten Objekte." — neutral, no tone.
- **Long active, no enquiries empty**: "Kein Objekt länger als 90 Tage ohne Anfrage."
- **All five empty**: the groups collapse into one calm line — "Nichts liegt an. Alle Objekte und Anfragen sind aktuell." — and metrics stay visible below.
- **Metrics with no data**: em dash plus label ("Ø Antwortzeit —"), never `0 €`, never `NaN`.
- **Brand-new install, zero listings**: the queue is replaced entirely by a first-run panel — one heading, one sentence explaining that listings drive the public site, one primary action "Erstes Objekt anlegen" linking to `/$locale/admin/listings/new`. Metrics are omitted in this state (there is nothing to measure yet).

## Part 4 — Technical shape

- New migration: three security-invoker SQL functions (`admin_listing_gaps`, `admin_stale_active`, `admin_dashboard_metrics`) so RLS and the existing permission helpers still govern rows; permission asserted in the server functions via `current_user_has_permission` (`analytics.view.*`, `inquiry.view.*`) — no role literals.
- `src/lib/dashboard/admin.functions.ts` — one admin-gated server function per queue group plus one for metrics, each with its own `queryOptions` so groups load independently and one slow query cannot block the page. `src/lib/dashboard/types.ts` for shapes, `src/lib/dashboard/period.ts` for preset→range resolution.
- Components under `src/components/admin/dashboard/`: `QueueGroup.tsx` (shell: title, count, empty line, "+N more"), `QueueItem.tsx`, one small item-body per group, `MetricsPanel.tsx`, `PeriodFilter.tsx`, `FirstRunPanel.tsx`. Presentation only, all values via props, tokens only, each file well under 200 lines.
- Route `src/routes/$locale.admin.index.tsx` composes the blocks and owns the period search param; the admin subtree keeps `ssr: false`.
- Every string added to `src/messages/de.json` and `en.json`, German using the shipped market terms (Entwurf, Aktiv, Reserviert, Verkauft, Vermietet, Archiviert); `check-i18n-keys.mjs` must pass.
