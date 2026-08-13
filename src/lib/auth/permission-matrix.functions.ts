// Loads the authoritative role matrix from public.role_permissions.
// The database is the single source of truth; this fn shapes it into the
// PermissionMatrix TypeScript type expected by hasPermission().
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ROLES,
  isRole,
  type PermissionKey,
  type PermissionMatrix,
  type Role,
} from "./permissions";

export const getPermissionMatrix = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PermissionMatrix> => {
    // The matrix is the admin panel's permission vocabulary: no longer readable
    // by anon, and gated here too. current_user_is_active() is the right bar —
    // every active staff member needs the matrix to render the admin shell,
    // and a deactivated or non-staff account gets nothing.
    const { data: active } = await context.supabase.rpc("current_user_is_active");
    if (active !== true) throw new Error("Forbidden");

    // Read with the service-role client: the table is authenticated-only and
    // the shape returned here is the role vocabulary, never user data.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("role_permissions")
      .select("role, permission_key, granted");
    if (error) throw error;


    const matrix = {} as PermissionMatrix;
    for (const row of (data ?? []) as {
      role: string;
      permission_key: string;
      granted: boolean;
    }[]) {
      if (!isRole(row.role)) continue;
      const key = row.permission_key as PermissionKey;
      if (!matrix[key]) {
        matrix[key] = ROLES.reduce(
          (acc, r) => ({ ...acc, [r]: false }),
          {} as Record<Role, boolean>,
        );
      }
      matrix[key][row.role] = row.granted;
    }
    return matrix;
  },
);

export const permissionMatrixQueryOptions = queryOptions({
  queryKey: ["permission-matrix"] as const,
  queryFn: () => getPermissionMatrix(),
  staleTime: 10 * 60_000,
});
