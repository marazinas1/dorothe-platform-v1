// Server-only classification and persistence for pageview pings. No raw IP or
// user agent is ever stored: the visitor id is a one-way, daily-rotating hash.

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bing|yandex|baidu|duckduck|facebookexternalhit|embedly|quora|pinterest|semrush|ahrefs|petal|headless|lighthouse|preview|monitor|curl|wget|python-requests|node-fetch|go-http/i;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function deviceFrom(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

export function sourceFrom(host: string | null): string {
  if (!host) return "direct";
  const h = host.toLowerCase();
  if (h.includes("google")) return "google";
  if (h.includes("bing") || h.includes("duckduckgo") || h.includes("yahoo")) return "search";
  if (h.includes("facebook") || h.includes("fb.")) return "facebook";
  if (h.includes("instagram")) return "instagram";
  if (h.includes("linkedin")) return "linkedin";
  if (
    h.includes("immoscout") ||
    h.includes("immowelt") ||
    h.includes("immonet") ||
    h.includes("kleinanzeigen") ||
    h.includes("willhaben")
  ) {
    return "portals";
  }
  return "other";
}

export async function visitorHash(
  salt: string,
  day: string,
  ip: string,
  userAgent: string,
): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}|${day}|${ip}|${userAgent}`),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface PageViewRow {
  path: string;
  referrer_host: string | null;
  source: string;
  device: string;
  country: string | null;
  visitor_hash: string;
  day: string;
}

export async function insertPageView(row: PageViewRow): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = (supabaseAdmin as any).from("page_views");
  const { error } = await table.insert(row);
  if (error) console.error("page_views insert failed:", error.message);
}
