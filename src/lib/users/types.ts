// Shared shapes for admin user management. Core module: no client data here.
import type { Role } from "@/lib/auth/permissions";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  last_sign_in_at: string | null;
  /** The caller's own row — never manageable. */
  is_self: boolean;
  /** True when the caller may change or delete this row. */
  can_manage: boolean;
  /** True when demoting/deactivating/deleting would leave no active owner. */
  is_last_owner: boolean;
}

export interface UsersOverview {
  callerRole: Role;
  users: AdminUser[];
}

export interface InviteResult {
  email: string;
  role: Role;
  /** True when an invitation email was accepted for delivery. */
  emailSent: boolean;
  /** Present only when email delivery was unavailable. */
  tempPassword: string | null;
  /** Password-set link to hand over manually. */
  resetLink: string | null;
  /** True when the address already had an account. */
  existed: boolean;
}
