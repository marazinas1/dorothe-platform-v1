// Dashboard server functions. One function per queue group plus one for the
// metrics, so every group loads, fails and retries independently: a broken
// aggregate never blanks the work queue.
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rowPublishBlockers } from "@/lib/listings/row-publish-check";
import type { AdminListingRow } from "@/lib/listings/admin.functions";
import { publishedGaps, GAP_ANCHOR } from "@/lib/listings/published-gaps";
import { assertCanUseDashboard, siteCountry } from "./admin.server";
import { QUEUE_LIMIT, STALE_ACTIVE_DAYS } from "./types";
import type {
  DashboardMetrics,
  QueueInquiryItem,
  QueueListingItem,
  QueueResult,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** Candidates scanned for gaps before the group truncates. */
const GAP_CANDIDATES = 25;

const PeriodInput = z.object({ from: z.string().min(1), to: z.string().min(1) });

export const dashboardInquiryQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QueueResult<QueueInquiryItem>> => {
    const { supabase, userId } = context;
    const { assertCanViewInquiries } = await import("@/lib/inquiries/admin.server");
    await assertCanViewInquiries(supabase, userId);

    const { data, error, count } = await supabase
      .from("inquiries")
      .select("id, type, status, name, email, created_at, listings(slug, title)", {
        count: "exact",
      })
      .in("status", ["new", "read"])
      .order("created_at", { ascending: true })
      .limit(QUEUE_LIMIT);
    if (error) throw new Error(error.message);

    const items = (data ?? []).map((row: Json) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      name: row.name,
      email: row.email,
      created_at: row.created_at,
      listing: row.listings ?? null,
    })) as QueueInquiryItem[];
    return { items, total: count ?? items.length };
  });

/** Drafts that would be rejected on publish, with the exact outstanding items. */
export const dashboardBlockedQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QueueResult<QueueListingItem>> => {
    const { supabase, userId } = context;
    await assertCanUseDashboard(supabase, userId);
    const country = await siteCountry(supabase);

    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, slug, status, title, deal_type, property_type, price, price_on_request, address_city, commission_free, commission_value, energy, energy_exemption, updated_at, listing_images(id)",
      )
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(GAP_CANDIDATES);
    if (error) throw new Error(error.message);

    const blocked: QueueListingItem[] = [];
    for (const row of (data ?? []) as Json[]) {
      const listing = {
        ...row,
        images: row.listing_images ?? [],
      } as unknown as AdminListingRow;
      const outstanding = rowPublishBlockers(listing, country);
      if (outstanding.length === 0) continue;
      blocked.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
        since: row.updated_at,
        reasons: outstanding.map((item) => ({
          key: item.key,
          anchor: item.anchor,
          ...(item.missing?.length ? { missing: item.missing } : {}),
        })),
      });
    }
    return { items: blocked.slice(0, QUEUE_LIMIT), total: blocked.length };
  });

/** Public listings that are live but visibly unfinished. */
export const dashboardGapsQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QueueResult<QueueListingItem>> => {
    const { supabase, userId } = context;
    await assertCanUseDashboard(supabase, userId);

    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, slug, status, title, description, geo_lat, geo_lng, reference_code, published_at, listing_images(id)",
      )
      .in("status", ["active", "coming_soon"])
      .order("published_at", { ascending: false })
      .limit(GAP_CANDIDATES);
    if (error) throw new Error(error.message);

    const withGaps: QueueListingItem[] = [];
    for (const row of (data ?? []) as Json[]) {
      const gaps = publishedGaps({
        description: row.description,
        geo_lat: row.geo_lat,
        geo_lng: row.geo_lng,
        reference_code: row.reference_code,
        imageCount: (row.listing_images ?? []).length,
      });
      if (gaps.length === 0) continue;
      withGaps.push({
        id: row.id,
        slug: row.slug,
        title: row.title,
        status: row.status,
        since: row.published_at,
        reasons: gaps.map((key) => ({ key, anchor: GAP_ANCHOR[key] })),
      });
    }
    return { items: withGaps.slice(0, QUEUE_LIMIT), total: withGaps.length };
  });

/** Reserved listings — a deal in progress that nobody should forget about. */
export const dashboardReservedQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QueueResult<QueueListingItem>> => {
    const { supabase, userId } = context;
    await assertCanUseDashboard(supabase, userId);

    const { data, error, count } = await supabase
      .from("listings")
      .select("id, slug, status, title, updated_at", { count: "exact" })
      .eq("status", "reserved")
      .order("updated_at", { ascending: true })
      .limit(QUEUE_LIMIT);
    if (error) throw new Error(error.message);

    const items = (data ?? []).map((row: Json) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: row.status,
      since: row.updated_at,
      reasons: [],
    })) as QueueListingItem[];
    return { items, total: count ?? items.length };
  });

/** Live for a long time with no enquiry at all — aggregated in SQL. */
export const dashboardStaleQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QueueResult<QueueListingItem>> => {
    const { supabase, userId } = context;
    await assertCanUseDashboard(supabase, userId);

    const { data, error } = await supabase.rpc("admin_stale_active", {
      _days: STALE_ACTIVE_DAYS,
      _limit: QUEUE_LIMIT,
    });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Json[];
    const items = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      status: "active",
      since: row.published_at,
      reasons: [],
    })) as QueueListingItem[];
    return { items, total: Number(rows[0]?.total ?? items.length) };
  });

export const dashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PeriodInput.parse(input))
  .handler(async ({ data, context }): Promise<DashboardMetrics> => {
    const { supabase, userId } = context;
    await assertCanUseDashboard(supabase, userId);

    const { data: raw, error } = await supabase.rpc("admin_dashboard_metrics", {
      _from: data.from,
      _to: data.to,
    });
    if (error) throw new Error(error.message);

    const value = (raw ?? {}) as Json;
    const closed = (value.closed_in_period ?? {}) as Record<string, number>;
    const processing = (value.processing ?? {}) as Json;
    return {
      listingsByStatus: (value.listings_by_status ?? {}) as Record<string, number>,
      inquiriesByType: (value.inquiries_by_type ?? {}) as Record<string, number>,
      closed: { sold: Number(closed.sold ?? 0), rented: Number(closed.rented ?? 0) },
      processing: {
        sample: Number(processing.sample ?? 0),
        avgSeconds:
          processing.avg_seconds == null ? null : Number(processing.avg_seconds),
      },
      totalListings: Number(value.total_listings ?? 0),
    };
  });

/** Listing-shaped groups, keyed so the UI can render them from one component. */
const LISTING_QUEUE_FNS = {
  blocked: dashboardBlockedQueue,
  gaps: dashboardGapsQueue,
  reserved: dashboardReservedQueue,
  stale: dashboardStaleQueue,
} as const;

export type ListingQueueKey = keyof typeof LISTING_QUEUE_FNS;
export const LISTING_QUEUE_KEYS = Object.keys(LISTING_QUEUE_FNS) as ListingQueueKey[];

export function listingQueueQueryOptions(key: ListingQueueKey) {
  return queryOptions({
    queryKey: ["admin", "dashboard", "queue", key],
    queryFn: (): Promise<QueueResult<QueueListingItem>> => LISTING_QUEUE_FNS[key](),
    staleTime: 30_000,
  });
}

export const inquiryQueueQueryOptions = queryOptions({
  queryKey: ["admin", "dashboard", "queue", "inquiries"],
  queryFn: (): Promise<QueueResult<QueueInquiryItem>> => dashboardInquiryQueue(),
  staleTime: 30_000,
});


export function metricsQueryOptions(from: string, to: string) {
  return queryOptions({
    queryKey: ["admin", "dashboard", "metrics", from, to],
    queryFn: () => dashboardMetrics({ data: { from, to } }),
    staleTime: 60_000,
  });
}
