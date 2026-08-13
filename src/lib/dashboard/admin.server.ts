// Server-only helpers for the dashboard. Kept out of the .functions module so
// nothing here can be reached from a client bundle.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Country } from "@/lib/validation/energy";

/**
 * The dashboard is a work queue over listings, so it requires the same
 * permission the listing list requires. RLS still narrows the rows.
 */
export async function assertCanUseDashboard(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: any_ } = await supabase.rpc("current_user_has_permission", {
    _key: "listing.edit.any",
  });
  if (any_ === true) return;
  const { assertPermission } = await import("@/lib/auth/require-permission.server");
  await assertPermission(supabase, userId, "listing.edit.own");
}

/**
 * Country drives the energy certificate rules, so the publish checklist can
 * only be evaluated server-side once the site's country is known.
 */
export async function siteCountry(supabase: SupabaseClient): Promise<Country> {
  const { data } = await supabase.from("site_settings").select("country").limit(1).maybeSingle();
  return ((data?.country as string | undefined) ?? "AT") as Country;
}
