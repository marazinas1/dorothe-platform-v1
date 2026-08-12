// Server-only helpers for the admin route gate.
// Extracts the Supabase access token from request cookies and validates it
// against Supabase Auth. Loads the caller's profile and enforces is_active.
import { getRequest } from "@tanstack/react-start/server";

import { isRole, type Role } from "./permissions";

export interface VerifiedAdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  avatar_url: string | null;
  public_photo_url: string | null;
  /** Per-user interface language of the admin panel; null = follow site default. */
  admin_locale: string | null;
}

const AUTH_COOKIE_RE = /sb-[^=;\s]+-auth-token(?:\.(\d+))?/;

/** Parse cookie header into a plain map, joining chunked Supabase cookies. */
function readSupabaseAuthCookie(): string | null {
  const request = getRequest();
  const header = request?.headers.get("cookie");
  if (!header) return null;

  const chunks = new Map<number, string>();
  let single: string | null = null;

  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq);
    const value = decodeURIComponent(part.slice(eq + 1));
    const match = AUTH_COOKIE_RE.exec(name);
    if (!match) continue;
    if (match[1] !== undefined) {
      chunks.set(Number(match[1]), value);
    } else {
      single = value;
    }
  }

  if (single !== null) return single;
  if (chunks.size === 0) return null;
  const ordered = [...chunks.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
  return ordered.join("");
}

function extractAccessToken(raw: string): string | null {
  let payload = raw;
  if (payload.startsWith("base64-")) {
    try {
      const b64 = payload.slice("base64-".length);
      // atob is available in the Worker runtime
      payload = atob(b64);
    } catch {
      return null;
    }
  }
  try {
    const parsed = JSON.parse(payload) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

/**
 * Fully verify an admin request:
 *  1. Cheap cookie presence check (fast anonymous rejection).
 *  2. Validate the access token with Supabase Auth (getUser).
 *  3. Load the caller's profile and confirm is_active.
 * Returns the verified profile or null when the request must be redirected.
 */
export async function verifyAdminSession(): Promise<VerifiedAdminProfile | null> {
  const raw = readSupabaseAuthCookie();
  if (!raw) return null;

  const token = extractAccessToken(raw);
  if (!token) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, is_active, avatar_url, public_photo_url, admin_locale")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) return null;
  if (!isRole(profile.role) || !profile.is_active) return null;

  return profile as VerifiedAdminProfile;
}
