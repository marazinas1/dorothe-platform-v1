// Address -> coordinates via Nominatim (OpenStreetMap). Runs server-side so no
// visitor IP ever reaches the geocoder and no key is exposed. Nominatim's usage
// policy allows roughly one request per second, so calls are serialised here and
// a 429 is reported as a normal outcome: the admin then places the pin by hand.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? v.trim() : ""));

const GeocodeInput = z.object({
  street: nullableText,
  number: nullableText,
  zip: nullableText,
  city: nullableText,
  region: nullableText,
  country: nullableText,
});

export type GeocodeFailure = "no_address" | "not_found" | "rate_limited" | "failed";

export type GeocodeResult =
  | { ok: true; lat: number; lng: number; label: string }
  | { ok: false; reason: GeocodeFailure };

/** Best-effort politeness gap. Workers are stateless, so this is per instance. */
let lastCallAt = 0;
const MIN_GAP_MS = 1100;

function buildQuery(data: z.output<typeof GeocodeInput>): string {
  const street = [data.street, data.number].filter(Boolean).join(" ");
  const town = [data.zip, data.city].filter(Boolean).join(" ");
  return [street, town, data.region, data.country].filter(Boolean).join(", ");
}

export const geocodeAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GeocodeInput.parse(input))
  .handler(async ({ data }): Promise<GeocodeResult> => {
    // A town or postcode is the minimum that can yield a usable pin.
    if (!data.city && !data.zip) return { ok: false, reason: "no_address" };

    const wait = MIN_GAP_MS - (Date.now() - lastCallAt);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastCallAt = Date.now();

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", buildQuery(data));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "0");

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "broker-platform/1.0 (listing admin geocoder)",
          Accept: "application/json",
        },
      });
      if (response.status === 429 || response.status === 503) {
        return { ok: false, reason: "rate_limited" };
      }
      if (!response.ok) return { ok: false, reason: "failed" };

      const results = (await response.json()) as { lat: string; lon: string; display_name?: string }[];
      const hit = Array.isArray(results) ? results[0] : undefined;
      if (!hit) return { ok: false, reason: "not_found" };

      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return { ok: false, reason: "not_found" };
      }
      return { ok: true, lat, lng, label: hit.display_name ?? "" };
    } catch {
      return { ok: false, reason: "failed" };
    }
  });
