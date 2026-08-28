// Server-only guards for admin user management. Every rule enforced here is
// also enforced in the database (triggers + RLS); this layer produces clear
// error messages instead of raw SQL exceptions.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Role } from "@/lib/auth/permissions";

export interface Caller {
  id: string;
  role: Role;
}

const MANAGER_ROLES: readonly Role[] = ["developer", "owner"];

/** Loads the caller and asserts they are an active manager. */
export async function requireManager(
  supabase: SupabaseClient,
  userId: string,
): Promise<Caller> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || data.is_active !== true) throw new Error("Forbidden");
  if (!MANAGER_ROLES.includes(data.role as Role)) throw new Error("Forbidden");
  return { id: data.id as string, role: data.role as Role };
}

/** A developer row is only manageable by a developer. */
export function canManage(caller: Caller, target: { id: string; role: Role }): boolean {
  if (target.id === caller.id) return false;
  if (caller.role === "developer") return true;
  return target.role !== "developer";
}

export function assertCanManage(
  caller: Caller,
  target: { id: string; role: Role },
): void {
  if (target.id === caller.id) {
    throw new Error("You cannot change your own access");
  }
  if (!canManage(caller, target)) {
    throw new Error("Only a developer may manage a developer account");
  }
}

/** Only a developer may hand out the developer role. */
export function assertCanAssign(caller: Caller, role: Role): void {
  if (role === "developer" && caller.role !== "developer") {
    throw new Error("Only a developer may grant the developer role");
  }
}

export function generateTempPassword(): string {
  const raw = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  return `${raw.slice(0, 14)}-Aa1`;
}
