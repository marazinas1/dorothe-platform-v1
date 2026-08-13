# Security review — seven findings, judged one by one

Everything below was verified against the live database (policies, grants, view options, function definitions) and the code paths that use them. No fixes applied yet.

---

## 7 (first, because it changes the picture) — "Security Definer View" — FALSE POSITIVE, do not fix

The flagged view is **`public.listings_public`**. It is ours. Verified: it is the only one of the four public views without `security_invoker`; `listing_images_public`, `listing_tours_public` and `listing_documents_public` all carry `{security_invoker=true}`.

Why it is flagged: a view without `security_invoker` runs with the owner's rights, so the linter warns that RLS on the base table is bypassed.

Why that is intentional here: `anon` has **no** SELECT on `public.listings` (revoked deliberately). `listings_public` filters `status IN (active, coming_soon, reserved, sold, rented)` inside the view and masks address/geo by `geo_precision` and commission by `commission_note_public`. It is the single public door to listing data. Flipping it to `security_invoker` would make it evaluate as `anon`, which has no read on `listings` — every public listing page, the index, the sold archive and (through the joined child views) all photos would return zero rows.

**Proposal: no change. Mark the finding as intentional in security memory with this reasoning so it stops being re-raised.**

## The other must-not-fix — "Public Can Execute SECURITY DEFINER Function"

Your reading is correct, and the category covers more than one function. `SECURITY DEFINER` functions currently executable by `anon`:

| Function | Anon needs it? | Verdict |
|---|---|---|
| `listing_is_public(uuid)` | Yes — it is the `USING` expression of the anon SELECT policies on `listing_images`, `listing_tours`, `listing_documents`. Revoking it removes every public photo, floor plan, tour and document. | **Keep. False positive.** |
| `increment_listing_view(uuid)` | No — only ever called through the service-role client | See 4 |
| `current_user_has_permission`, `current_user_role`, `current_user_is_active`, `has_role`, `count_active_owners`, `storage_can_edit_listing_object` | No — no anon-facing policy references them | See 6 |
| trigger functions (`handle_new_user`, `listings_set_actor`, `listings_validate_energy_on_publish`, `permissions_guard_overrides`, `profiles_*`) | No — triggers fire regardless of EXECUTE grants | Revoke from anon and authenticated (harmless, silences noise) |

So: the judgement is per function, and only `listing_is_public` stays open to anon.

---

## 1 — Slug history readable by anon — REAL

Verified: `GRANT SELECT ... TO anon` plus policy `slug history read` = `USING (true)`. Anyone with the anon key can list every superseded slug and `listing_id`, including drafts and archived listings.

The redirect itself already refuses to leak: `resolveSupersededSlug` looks the id up in `listings_public`, so a history hit on a non-public listing returns `null`. Only the enumeration is the problem.

**Proposal**
- Migration: drop the anon SELECT policy, `REVOKE SELECT ... FROM anon`. Keep the authenticated write/read policy gated by `current_user_has_permission('listing.edit.any')`.
- Change `resolveSupersededSlug` to read the history table through the server-only admin client inside its handler, then keep the existing second step against `listings_public`. Result unchanged for published listings, `null` for drafts/archived, table invisible to anon.

## 2 — `listing-images` bucket public regardless of status — REAL, and the honest answer is: not worth full gating

Verified: bucket is public; the only anon SELECT policy is `bucket_id = 'listing-images'`. Paths are `listings/<listing uuid>/<image uuid>/<variant>.webp` — two unguessable UUIDs, and the image rows for a draft are not readable by anon, so there is no way to *discover* a draft's paths through the API. Exposure requires someone already holding the URL.

Cost of real gating: a public bucket serves images straight from CDN with plain `<img src>`. Gating on listing status means making the bucket private, which kills every public `<img>` URL. Then:
- every public read path (`listing_images_public.variants` holds absolute public URLs) has to switch to signed URLs minted server-side per request, with an expiry; OG/`twitter:image` tags need long-lived signed URLs, which browsers and crawlers cache badly and which expire in shared links;
- the browser upload pipeline stores those absolute URLs in `variants` — that JSON and `src/lib/listings/image.ts` would have to become path-based;
- the admin editor and dashboard thumbnails move to signed URLs too;
- CDN caching is lost, so listing pages get slower.

That is a multi-day change affecting the image pipeline, SEO tags and the admin, for an exposure that requires a leaked UUID path.

**Proposal (pick one):**
- **A (recommended):** leave the public bucket; add a migration that hard-deletes a listing's storage folder when it is archived or reverted to draft — no, correction: on *unpublish* the row stays, so instead treat this as accepted risk and record it in security memory with the UUID-path reasoning. No code change.
- **B:** full private-bucket + signed-URL migration, estimated a full working session across the pipeline, admin, SEO tags and public components, plus an end-to-end re-verification. Only worth it if drafts routinely contain owner-confidential photos that must be provably unreachable.

I recommend A now and B only on your word.

## 3 — Signed-in users can execute SECURITY DEFINER functions — REAL, and worse than the scanner says

Verified: `admin_stale_active` and `admin_dashboard_metrics` are *not* SECURITY DEFINER (so RLS still applies to them) but they carry **no internal permission check** and are executable by every authenticated user. The dashboard asserts permission in the server function only — exactly the pattern you called out. `storage_can_edit_listing_object` and the trigger functions are also broadly executable.

**Proposal**
- Migration: add an internal guard at the top of `admin_stale_active` and `admin_dashboard_metrics` using `current_user_has_permission('listing.edit.own')` / `('listing.edit.any')` (same rule the dashboard uses), raising on failure. No role literals.
- `REVOKE EXECUTE ... FROM anon` on both, and on every trigger function and on `storage_can_edit_listing_object` (used only inside storage policies, which run as the definer chain, not via EXECUTE grants — verified no anon-facing policy calls it).
- Keep the server-function assertion as defence in depth.

## 4 — `increment_listing_view` callable by anon — REAL, and cheaply fixed

Verified: it is `SECURITY DEFINER` with EXECUTE granted to `anon` and `authenticated`, but the app calls it **only** from `views.server.ts` through `supabaseAdmin` (service role). So the anon grant buys nothing and lets anyone inflate any published listing's counter with a loop.

**Proposal:** `REVOKE EXECUTE ... FROM anon, authenticated`, leaving `service_role`. No cookies, no identifiers, no design change — the existing bot/prefetch/auth filtering in `isCountableView()` stays the only heuristic. Counts then can only be moved by requests that actually reach the server route. Residual exposure (repeat page loads by one visitor) is unchanged and, per the cookieless design, not worth addressing.

## 5 — Permission matrix readable by anon — REAL, small

Verified: `role_permissions readable by all` = `TO anon, authenticated USING (true)`, and `GRANT SELECT` includes anon.

Caveat found while checking: `getPermissionMatrix` reads this table through the **publishable-key** client, i.e. as anon. Restricting the policy without touching that would break the admin permission matrix.

**Proposal:** migration restricts the policy and grant to `authenticated` (+ `service_role`), and `getPermissionMatrix` switches to the server-only admin client inside its handler. Same for `owner_only_permissions` if it turns out to be read on the same path (its policy is already authenticated-only).

## 6 — Permission-check helpers callable by anon — REAL, small

`current_user_role`, `current_user_has_permission`, `current_user_is_active`, `has_role`, `count_active_owners` — all return only booleans/strings about the caller, and no anon-facing policy uses them (verified against `pg_policies`).

**Proposal:** `REVOKE EXECUTE ... FROM anon` on those five, keep `authenticated` and `service_role`. `listing_is_public` explicitly excluded.

---

## Dependency vulnerabilities — cannot confirm "three"

The platform dependency scanner reports **no high or critical vulnerabilities**, and the registry audit endpoint is unavailable in this sandbox (404), so I cannot enumerate moderate/low advisories. I will not guess package names. Either paste the three entries you can see and I will report package, severity, whether the vulnerable code path is reachable here, and upgrade risk — or I will report this as "no high/critical, lower severities not retrievable". Nothing gets upgraded in this task either way.

---

## What the fix migration would contain (if you approve 1, 3, 4, 5, 6)

One migration, no client data:
1. slug history: drop anon policy + revoke anon SELECT.
2. `admin_stale_active`, `admin_dashboard_metrics`: internal permission guard via existing helpers; revoke anon EXECUTE.
3. `increment_listing_view`: revoke anon + authenticated EXECUTE.
4. `role_permissions`: policy and grant restricted to authenticated/service_role.
5. Revoke anon EXECUTE on the five caller-scoped helpers, `storage_can_edit_listing_object`, and all trigger functions. `listing_is_public` untouched.

Plus two code changes: `resolveSupersededSlug` and `getPermissionMatrix` move their reads to the admin client inside their handlers.

## Verification after the migration

With the anon key end to end, via a headless browser against the running app: homepage renders, listing index lists published properties, a listing detail page resolves with photos loading from the images bucket, the map placeholder loads its tiles, an old slug redirects to the current one for a published listing, an old slug of a draft 404s, and the admin dashboard + settings still load for the owner account. Also re-run the database linter to confirm only the two intentional findings remain.
