// Server-side permission assertion. Use inside privileged createServerFn
// handlers together with requireSupabaseAuth middleware. Throws a 403 Response
// when the caller lacks the permission.
//
// The database is the single source of truth: we delegate to the SQL helper
// current_user_has_permission(text), which checks overrides then the
// role_permissions matrix under the caller's session.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { PermissionKey } from "./permissions";

export async function assertPermission(
  supabase: SupabaseClient,
  _userId: string,
  key: PermissionKey,
): Promise<void> {
  const { data, error } = await supabase.rpc("current_user_has_permission", {
    _key: key,
  });

  if (error || data !== true) {
    throw new Error("Forbidden");
  }
}
