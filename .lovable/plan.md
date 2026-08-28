# Fix role_permissions matrix: restore user.invite, drop inquiry.delete

## Goal

Correct two keys that were swapped in the last migration's Developer/Owner
grant list, so the database matches the `PermissionKey` union in
`src/lib/auth/permissions.ts` exactly.

## Changes (data-only — no schema migration)

1. **Verify current state first** with a read query on `role_permissions`:
   - Confirm `inquiry.delete` rows exist for `developer`/`owner` and
     `user.invite` rows are missing for both.
2. **Add `user.invite`** rows with `granted = true` for roles `developer`
   and `owner` (idempotent upsert so re-runs are safe).
3. **Delete all `inquiry.delete` rows** from `role_permissions` (any role).
   No `inquiry-delete` feature exists; if one is wanted later it gets its
   own key in `permissions.ts` plus a fresh grant.

No code changes required — `user.invite` is already a declared
`PermissionKey`; nothing references `inquiry.delete`.

## Verification

- Read query: Developer and Owner each hold exactly the 16 original keys
  (listing.create/edit.own/edit.any/publish/delete/status.change,
  inquiry.view.own/view.any/assign, user.invite, user.manage, settings.edit,
  design.edit, content.edit, analytics.view.own/view.any), all granted.
- Editor's rows untouched.
- `inquiry.delete` returns zero rows.
- Build passes (no code touched, so no typecheck risk).
