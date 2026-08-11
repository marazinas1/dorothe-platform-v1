import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { PAGE_SIZE } from "./search-schema";

const PublicSaleStatuses = ["active", "coming_soon"] as const;

type ImageRow = {
  id: string | null;
  listing_id: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
  variants: any;
  alt_text: any;
  width: number | null;
  height: number | null;
};

export type PublicListing = {
  id: string;
  slug: string;
  reference_code: string | null;
  status: string;
  deal_type: string;
  property_type: string;
  price: number | null;
  price_on_request: boolean | null;
  price_period: string | null;
  living_area: number | null;
  plot_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  year_renovated: number | null;
  condition: string | null;
  heating_type: string | null;
  address_street: string | null;
  address_number: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_precision: string | null;
  energy: any;
  features: string[] | null;
  content_sections: any;
  highlights: any;
  floor: number | null;
  total_floors: number | null;
  title: any;
  description: any;
  service_charge: number | null;
  commission_value: number | null;
  commission_type: string | null;
  commission_payer: string | null;
  rental_status: string | null;
  availability_date: string | null;
  energy_exemption: string | null;
  agent_id: string | null;
  sold_at: string | null;
  published_at: string | null;
  images: ImageRow[];
};

async function getPublicClient() {
  const { createPublicSupabase } = await import("@/lib/supabase/server-public");
  return createPublicSupabase();
}

function normalizeRow(row: any, images: ImageRow[]): PublicListing {
  return { ...row, images } as PublicListing;
}

// ---- List (with filters) ----

const ListInput = z.object({
  deal: z.string().default(""),
  type: z.string().default(""),
  city: z.string().default(""),
  rooms_min: z.number().default(0),
  price_min: z.number().default(0),
  price_max: z.number().default(0),
  area_min: z.number().default(0),
  sort: z.string().default("newest"),
  page: z.number().default(1),
  onlyStatus: z.array(z.string()).default([...PublicSaleStatuses]),
  featured: z.boolean().optional(),
  limit: z.number().optional(),
});

export const listPublicListings = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => ListInput.parse(raw ?? {}))
  .handler(async ({ data }) => {
    const supabase = await getPublicClient();
    let query = supabase
      .from("listings_public")
      .select("*", { count: "exact" })
      .in("status", data.onlyStatus);
    if (data.deal) query = query.eq("deal_type", data.deal);
    if (data.type) query = query.eq("property_type", data.type);
    if (data.city) query = query.ilike("address_city", `%${data.city}%`);
    if (data.rooms_min > 0) query = query.gte("rooms", data.rooms_min);
    if (data.price_min > 0) query = query.gte("price", data.price_min);
    if (data.price_max > 0) query = query.lte("price", data.price_max);
    if (data.area_min > 0) query = query.gte("living_area", data.area_min);
    // A `featured` request also surfaces coming-soon listings, so a
    // pre-market property never disappears just because it isn't flagged
    // is_featured yet — those are the strongest listings a broker has.
    if (data.featured) query = query.or("is_featured.eq.true,status.eq.coming_soon");

    switch (data.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true, nullsFirst: false });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      default:
        query = query
          .order("sort_order", { ascending: true })
          .order("published_at", { ascending: false, nullsFirst: false });
    }

    const limit = data.limit ?? PAGE_SIZE;
    const from = (Math.max(1, data.page) - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    const listingIds = (rows ?? []).map((r: any) => r.id).filter(Boolean);
    const images = listingIds.length
      ? await fetchImages(listingIds)
      : new Map<string, ImageRow[]>();
    const normalized = (rows ?? []).map((r: any) =>
      normalizeRow(r, images.get(r.id) ?? []),
    );
    return { items: normalized, total: count ?? 0 };
  });

async function fetchImages(listingIds: string[]) {
  const supabase = await getPublicClient();
  const { data, error } = await supabase
    .from("listing_images_public")
    .select("*")
    .in("listing_id", listingIds)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const byId = new Map<string, ImageRow[]>();
  for (const row of (data ?? []) as ImageRow[]) {
    if (!row.listing_id) continue;
    const list = byId.get(row.listing_id) ?? [];
    list.push(row);
    byId.set(row.listing_id, list);
  }
  return byId;
}

// ---- Sold archive ----

export const listSoldListings = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ page: z.number().default(1) }).parse(raw ?? {}),
  )
  .handler(async ({ data }) => {
    return listPublicListings({
      data: {
        deal: "",
        type: "",
        city: "",
        rooms_min: 0,
        price_min: 0,
        price_max: 0,
        area_min: 0,
        sort: "newest",
        page: data.page,
        onlyStatus: ["sold", "rented"],
      },
    } as any);
  });

// ---- Get by slug ----

export const getListingBySlug = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ slug: z.string() }).parse(raw))
  .handler(async ({ data }): Promise<PublicListing | null> => {
    const supabase = await getPublicClient();
    const { data: row, error } = await supabase
      .from("listings_public")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const images = await fetchImages([row.id as string]);
    return normalizeRow(row, images.get(row.id as string) ?? []);
  });

export const featuredListingsQueryOptions = queryOptions({
  queryKey: ["listings", "featured"],
  queryFn: () =>
    listPublicListings({
      data: {
        deal: "",
        type: "",
        city: "",
        rooms_min: 0,
        price_min: 0,
        price_max: 0,
        area_min: 0,
        sort: "newest",
        page: 1,
        onlyStatus: [...PublicSaleStatuses],
        featured: true,
        limit: 6,
      },
    } as any),
  staleTime: 30_000,
});

export const recentSoldQueryOptions = queryOptions({
  queryKey: ["listings", "recent-sold"],
  queryFn: () =>
    listPublicListings({
      data: {
        deal: "",
        type: "",
        city: "",
        rooms_min: 0,
        price_min: 0,
        price_max: 0,
        area_min: 0,
        sort: "newest",
        page: 1,
        onlyStatus: ["sold", "rented"],
        limit: 6,
      },
    } as any),
  staleTime: 60_000,
});

/** All currently available listings — used by the about page ("my properties"). */
export const activeListingsQueryOptions = queryOptions({
  queryKey: ["listings", "active", "about"],
  queryFn: () =>
    listPublicListings({
      data: {
        deal: "",
        type: "",
        city: "",
        rooms_min: 0,
        price_min: 0,
        price_max: 0,
        area_min: 0,
        sort: "newest",
        page: 1,
        onlyStatus: [...PublicSaleStatuses],
        limit: 6,
      },
    } as any),
  staleTime: 60_000,
});
