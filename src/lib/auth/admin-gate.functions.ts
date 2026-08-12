// Server-side gate used by the admin route layout.
//
// The browser Supabase client stores its session in localStorage, not cookies,
// so a cookie-based server gate can never see a freshly created session. This
// gate therefore runs as an authenticated server function: the client bearer
// middleware attaches the access token, `requireSupabaseAuth` validates it, and
// the profile is loaded under the caller's own session (RLS applies).
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isRole } from "./permissions";
import type { VerifiedAdminProfile } from "./admin-gate.server";

export const verifyAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VerifiedAdminProfile | null> => {
    const { supabase, userId } = context;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, role, is_active, avatar_url, public_photo_url, admin_locale",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile) return null;
    if (!isRole(profile.role) || !profile.is_active) return null;

    return profile as VerifiedAdminProfile;
  });
