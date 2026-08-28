// Server-only implementation of admin user management.
// Privileged Auth Admin API calls run through the service-role client, always
// after the caller has been verified through their own session.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";

import { assertPermission } from "@/lib/auth/require-permission.server";
import type { Role } from "@/lib/auth/permissions";
import type { AdminUser, InviteResult, UsersOverview } from "./types";
import {
  assertCanAssign,
  assertCanManage,
  canManage,
  generateTempPassword,
  requireManager,
  type Caller,
} from "./guards.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function enter(supabase: SupabaseClient, userId: string): Promise<Caller> {
  const caller = await requireManager(supabase, userId);
  await assertPermission(supabase, userId, "user.manage");
  return caller;
}

async function loadTarget(userId: string): Promise<{ id: string; role: Role }> {
  const db = await admin();
  const { data, error } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) throw new Error("Account not found");
  return { id: data.id as string, role: data.role as Role };
}

export async function loadUsers(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsersOverview> {
  const caller = await enter(supabase, userId);
  const db = await admin();

  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, email, full_name, role, is_active, last_login_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
  const signIns = new Map<string, string | null>(
    (authList?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]),
  );

  const rows = (profiles ?? []) as {
    id: string;
    email: string;
    full_name: string | null;
    role: Role;
    is_active: boolean;
    last_login_at: string | null;
  }[];
  const activeOwners = rows.filter((r) => r.role === "owner" && r.is_active).length;

  const users: AdminUser[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    is_active: row.is_active,
    last_sign_in_at: signIns.get(row.id) ?? row.last_login_at,
    is_self: row.id === caller.id,
    can_manage: canManage(caller, row),
    is_last_owner: row.role === "owner" && row.is_active && activeOwners <= 1,
  }));

  return { callerRole: caller.role, users };
}

function siteOrigin(): string {
  const url = getRequest()?.url;
  return url ? new URL(url).origin : "";
}

async function recoveryLink(email: string, redirectTo: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });
  return data?.properties?.action_link ?? null;
}

export async function inviteOrCreateUser(
  supabase: SupabaseClient,
  userId: string,
  input: { email: string; role: Role },
): Promise<InviteResult> {
  const caller = await enter(supabase, userId);
  assertCanAssign(caller, input.role);

  const email = input.email.trim().toLowerCase();
  const db = await admin();
  const redirectTo = `${siteOrigin()}/auth/reset-password`;

  // Store the intended role first: the signup trigger reads it.
  await db.from("user_invitations").insert({
    email,
    role: input.role,
    invited_by: caller.id,
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 14 * 864e5).toISOString(),
  });

  const { data: existing } = await db
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing) {
    return {
      email,
      role: input.role,
      emailSent: false,
      tempPassword: null,
      resetLink: await recoveryLink(email, redirectTo),
      existed: true,
    };
  }

  const invited = await db.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (!invited.error) {
    return {
      email,
      role: input.role,
      emailSent: true,
      tempPassword: null,
      resetLink: null,
      existed: false,
    };
  }

  // Email delivery unavailable: create the account and hand over credentials.
  const tempPassword = generateTempPassword();
  const created = await db.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (created.error) throw new Error(created.error.message);

  return {
    email,
    role: input.role,
    emailSent: false,
    tempPassword,
    resetLink: await recoveryLink(email, redirectTo),
    existed: false,
  };
}

export async function changeUserRole(
  supabase: SupabaseClient,
  userId: string,
  input: { userId: string; role: Role },
): Promise<{ ok: true }> {
  const caller = await enter(supabase, userId);
  const target = await loadTarget(input.userId);
  assertCanManage(caller, target);
  assertCanAssign(caller, input.role);

  // Written through the caller's own session so the database triggers see the
  // real actor (a developer may override the last-owner lock, an owner may not).
  const { error } = await supabase
    .from("profiles")
    .update({ role: input.role })
    .eq("id", target.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function setActive(
  supabase: SupabaseClient,
  userId: string,
  targetId: string,
  isActive: boolean,
): Promise<{ ok: true }> {
  const caller = await enter(supabase, userId);
  const target = await loadTarget(targetId);
  assertCanManage(caller, target);

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", target.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export const deactivateUser = (s: SupabaseClient, u: string, t: string) =>
  setActive(s, u, t, false);
export const reactivateUser = (s: SupabaseClient, u: string, t: string) =>
  setActive(s, u, t, true);

export async function removeUser(
  supabase: SupabaseClient,
  userId: string,
  targetId: string,
): Promise<{ ok: true }> {
  const caller = await enter(supabase, userId);
  const target = await loadTarget(targetId);
  assertCanManage(caller, target);

  const db = await admin();
  const { error } = await db.auth.admin.deleteUser(target.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
