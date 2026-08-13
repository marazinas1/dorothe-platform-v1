import { getRequest } from "@tanstack/react-start/server";

import { hasSupabaseSessionCookie } from "@/lib/auth/session-cookie.server";

/**
 * Obvious automated clients. The list is deliberately coarse: the counter only
 * has to be good enough to tell interest from silence, and no identifier is
 * ever stored, so a mis-classified request costs nothing.
 */
const BOT_UA =
  /bot|crawler|crawl|spider|slurp|scrap|curl|wget|headless|phantom|lighthouse|monitor|uptime|pingdom|semrush|ahrefs|python-requests|node-fetch|axios|okhttp|java\/|go-http|facebookexternalhit|embedly|preview/i;

/**
 * Should this request be counted as a page view?
 *
 * No cookie is set, no IP or identifier is read for counting — only the
 * User-Agent (to drop bots), the auth signals (to drop the broker's own
 * visits) and prefetch hints.
 */
export function isCountableView(): boolean {
  const headers = getRequest()?.headers;
  const ua = headers?.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return false;

  // Speculative loads are not views.
  const purpose = headers?.get("purpose") ?? headers?.get("x-purpose") ?? "";
  const secPurpose = headers?.get("sec-purpose") ?? "";
  if (purpose === "prefetch" || secPurpose.includes("prefetch")) return false;

  // A signed-in user is the broker looking at her own site.
  if (headers?.get("authorization")) return false;
  if (hasSupabaseSessionCookie()) return false;

  return true;
}

/** Atomic +1 on listings.view_count. Never throws into the caller. */
export async function bumpViewCount(listingId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("increment_listing_view", { _listing_id: listingId });
}
