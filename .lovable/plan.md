# Admin user management — Developer / Owner / Editor

Bring this project's access model in line with the Halliday-Architects one: three roles, a protected Developer tier at the top, and a Users page in the admin panel where the Developer or an Owner invites people, changes roles, revokes access or deletes an account.

## The three roles

| Role | Who | Can do |
| --- | --- | --- |
| Developer | you (rutkusmarius@gmail.com) | everything, including things owners cannot see or change; only a Developer can grant or modify the Developer role |
| Owner | Dorothe | everything in the site: listings, publishing, enquiries, settings, design, team, and managing Owners/Editors |
| Editor | staff | listings and enquiries work: create/edit/publish listings, see and handle enquiries, own analytics. No settings, no design, no user management |

Guards, same as the reference project:
- Nobody can change or delete their own access.
- Developer accounts are visible to owners (so Dorothe sees who maintains the system) but cannot be edited by them.
- The site must always keep at least one active Owner — the last one cannot be demoted, deactivated or deleted.
- Only a Developer can create another Developer.

## Migration of the current accounts

Today `profiles.role` allows owner / admin / agent / assistant / viewer. Existing rows: rutkusmarius (owner), dorothe.waltner (admin), plus one leftover security-probe account (viewer).

- rutkusmarius@gmail.com becomes `developer`
- dorothe.waltner@gmail.com becomes `owner`
- the leftover probe account is deactivated and its role mapped to `editor`
- the role vocabulary becomes exactly `developer`, `owner`, `editor`; `admin`/`agent`/`assistant`/`viewer` are mapped to `editor` and removed from the permission matrix and the role check

The 16 permission keys stay as they are — only the roles column changes: Developer and Owner get all of them; Editor gets listing create/edit-own/edit-any/publish/status-change, enquiry view-own/view-any/assign, and own analytics.

## Users page

New route `/{locale}/admin/users`, replacing the "Team" stub in the sidebar (nav item renamed to Users, gated on `user.manage`, no feature flag).

- **Invite someone** — email field + role select (Owner / Editor; Developer only offered when a Developer is signed in) + Invite button. The system tries a real invitation email first; if email delivery isn't available it creates the account and shows a one-time temporary password and a password-reset link with copy buttons, so the credentials can be handed over directly. An address that already exists gets a fresh reset link instead, with its role untouched.
- **Accounts** — one row per account: email, badges (You / Developer / Last owner / Invited), current role, last sign-in. Controls per row: role select, "Revoke access" (removes the role, keeps the account), and a separate confirm-typed "Delete account" (irreversible). Everything disabled where a guard applies, with the reason in a tooltip.
- Errors surface as toasts carrying the message the database or the server returned, never a raw stack.
- Styling follows the existing admin design tokens; strings go through i18n (EN + DE), no hardcoded copy.

## Technical notes

Database migration:
- widen then narrow `profiles_role_check` to `('developer','owner','editor')`, remap existing rows, rewrite `role_permissions` for the three roles
- new SQL helpers `is_developer()`, `is_owner_or_above()`, `is_staff()` layered on the existing `current_user_role()` / `has_role()` pattern; `current_user_has_permission()` short-circuits to true for `developer`
- `profiles_enforce_role_integrity()` extended: only a Developer may grant/revoke `developer` or edit a developer row; owners may manage owner/editor rows; self role/active changes still refused. `permissions_guard_overrides()` loses its `admin` special case and gains the developer shield. Last-active-owner protection triggers stay
- profiles RLS updated to the same shape: developer sees and manages everyone, owner manages everyone who is not a developer
- `handle_new_user()` keeps resolving an invited role, defaulting to `editor` and never to a privileged role

Application code:
- `src/lib/auth/permissions.ts`: `Role` becomes `"developer" | "owner" | "editor"`; `hasPermission` treats `developer` like the current owner safeguard
- `src/lib/users/manage.functions.ts` — authenticated server functions (`listUsers`, `inviteUser`, `setUserRole`, `revokeAccess`, `deleteUser`). Each verifies the caller is Developer or Owner through their own session first, then loads `supabaseAdmin` inside the handler for the Auth Admin API calls. All the guards above are re-checked server-side, not just in the UI
- `src/lib/users/types.ts` for the shared shapes, `src/lib/users/use-manage-users.ts` for the react-query hooks
- `src/components/admin/users/UsersPage.tsx`, `InviteUserForm.tsx`, `InviteResultPanel.tsx`, `UserRow.tsx` — each well under 200 lines; the route file only composes and sets head metadata
- invitation links point at the existing `/{locale}/auth/reset-password` route, so no new auth screen is needed
- `AdminSidebar.tsx`: `team` nav item becomes `users` pointing at the new route
- new keys in `src/messages/en.json` and `de.json`; nothing client-specific anywhere

Verification: sign in as the Developer account, confirm the Users page lists all accounts, that Dorothe shows as Owner and the developer row is shielded, and that an Editor account cannot reach settings or the Users page.
