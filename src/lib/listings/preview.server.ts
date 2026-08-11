// Server-only preview helpers.
//
// A preview link carries a short-lived HMAC token so the public detail route
// can render an unpublished listing during SSR (a new browser tab has no
// bearer token). Without a valid token the public route stays a 404 for
// anonymous visitors, so drafts never leak.
import type { PublicListing } from "./queries.functions";

const TTL_SECONDS = 30 * 60;

function secret(): string {
  const value = process.env.LISTING_PREVIEW_SECRET;
  if (!value) throw new Error("Missing LISTING_PREVIEW_SECRET");
  return value;
}

function b64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

export async function createPreviewToken(slug: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `${slug}.${exp}`;
  return `${payload}.${await sign(payload)}`;
}

/** Constant-time-ish comparison of the recomputed signature. */
export async function verifyPreviewToken(slug: string, token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenSlug, expRaw, signature] = parts;
  if (tokenSlug !== slug) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

  const expected = await sign(`${tokenSlug}.${expRaw}`);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Reads the listing in whatever state it is saved in and applies the same
 * masking rules as public.listings_public, so the preview matches what a
 * visitor would see after publishing.
 */
export async function loadPreviewListing(slug: string): Promise<PublicListing | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row, error } = await supabaseAdmin
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: images } = await supabaseAdmin
    .from("listing_images")
    .select(
      "id, listing_id, storage_path, variants, alt_text, caption, sort_order, is_primary, width, height",
    )
    .eq("listing_id", row.id as string)
    .order("sort_order", { ascending: true });

  return maskListing(row, images ?? []);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function maskListing(row: any, images: any[]): PublicListing {
  const exact = row.geo_precision === "exact";
  const round = (v: number | null) =>
    v == null ? null : row.geo_precision === "exact" ? v : Math.round(v * 1000) / 1000;

  const {
    sold_price: _soldPrice,
    expose_notes: _exposeNotes,
    view_count: _views,
    inquiry_count: _inquiries,
    created_by: _createdBy,
    updated_by: _updatedBy,
    ...rest
  } = row;

  return {
    ...rest,
    address_street: exact ? row.address_street : null,
    address_number: exact ? row.address_number : null,
    geo_lat: row.geo_precision === "hidden" ? null : round(row.geo_lat),
    geo_lng: row.geo_precision === "hidden" ? null : round(row.geo_lng),
    commission_note: row.commission_note_public ? row.commission_note : null,
    images,
  } as PublicListing;
}
