// Admin user management server functions. Thin wrappers only: every runtime
// helper lives in ./manage.server.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { InviteResult, UsersOverview } from "./types";

const roleSchema = z.enum(["developer", "owner", "editor"]);

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsersOverview> => {
    const { loadUsers } = await import("./manage.server");
    return loadUsers(context.supabase, context.userId);
  });

export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ email: z.string().trim().email(), role: roleSchema }).parse(data),
  )
  .handler(async ({ context, data }): Promise<InviteResult> => {
    const { inviteOrCreateUser } = await import("./manage.server");
    return inviteOrCreateUser(context.supabase, context.userId, data);
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), role: roleSchema }).parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { changeUserRole } = await import("./manage.server");
    return changeUserRole(context.supabase, context.userId, data);
  });

export const revokeAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { deactivateUser } = await import("./manage.server");
    return deactivateUser(context.supabase, context.userId, data.userId);
  });

export const restoreAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { reactivateUser } = await import("./manage.server");
    return reactivateUser(context.supabase, context.userId, data.userId);
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { removeUser } = await import("./manage.server");
    return removeUser(context.supabase, context.userId, data.userId);
  });
