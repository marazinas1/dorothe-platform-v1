// Admin-side listing server functions. These read/write `public.listings`
// directly (not the public view) as the signed-in user, so RLS decides what
// each role may see, and every mutation re-asserts the permission server-side.
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ListingFormSchema, LISTING_STATUSES } from "./admin-schema";
import {
  assertCanEditListing,
  toListingRow,
} from "./admin.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

export type AdminListingRow = {
  id: string;
  slug: string;
  status: string;
  deal_type: string;
  property_type: string;
  price: number | null;
  price_on_request: boolean | null;
  address_city: string | null;
  reference_code: string | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  living_area: number | null;
  title: Json;
  updated_at: string;
  images: { variants: Json; is_primary: boolean | null; sort_order: number | null }[];
};

export const listAdminListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminListingRow[]> => {
    const { data, error } = await context.supabase
      .from("listings")
      .select(
        "id, slug, status, deal_type, property_type, price, price_on_request, address_city, reference_code, rooms, bedrooms, bathrooms, living_area, title, updated_at, listing_images(variants, is_primary, sort_order)",
      )
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: Json) => ({
      ...(row as unknown as AdminListingRow),
      images: (row.listing_images ?? []) as AdminListingRow["images"],
    }));
  });


export const adminListingsQueryOptions = queryOptions({
  queryKey: ["admin", "listings"],
  queryFn: () => listAdminListings(),
});

export const getAdminListing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("listings")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    const { data: images, error: imgError } = await context.supabase
      .from("listing_images")
      .select(
        "id, storage_path, original_storage_path, content_type, variants, sort_order, is_primary, processing_status, processing_error, width, height",
      )
      .eq("listing_id", data.id)
      .order("sort_order", { ascending: true });
    if (imgError) throw new Error(imgError.message);

    return { listing: row as Json, images: (images ?? []) as Json[] };
  });

export function adminListingQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["admin", "listing", id],
    queryFn: () => getAdminListing({ data: { id } }),
  });
}

export const saveListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListingFormSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { assertPermission } = await import("@/lib/auth/require-permission.server");
    const patch = toListingRow(data);

    if (!data.id) {
      await assertPermission(supabase, userId, "listing.create");
      const { data: created, error } = await supabase
        .from("listings")
        .insert({ ...patch, status: "draft" } as never)
        .select("id, slug, status")
        .maybeSingle();
      if (error || !created) {
        throw new Error(error?.message ?? "Insert failed");
      }
      return created as { id: string; slug: string; status: string };
    }

    await assertCanEditListing(supabase, userId, data.id);
    const { data: updated, error } = await supabase
      .from("listings")
      .update(patch as never)
      .eq("id", data.id)
      .select("id, slug, status")
      .maybeSingle();
    if (error || !updated) {
      throw new Error(error?.message ?? "Update failed");
    }
    return updated as { id: string; slug: string; status: string };
  });

const StatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(LISTING_STATUSES),
});

export const changeListingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCanEditListing(supabase, userId, data.id);

    // The database owns the flow rules and the publish/status permissions:
    // listings_enforce_status_flow, listings_enforce_publish_permission and
    // listings_validate_energy_on_publish all run here. Surface their message.
    const { data: updated, error } = await supabase
      .from("listings")
      .update({ status: data.status } as never)
      .eq("id", data.id)
      .select("id, status, slug")
      .maybeSingle();
    if (error || !updated) {
      throw new Error(error?.message ?? "Status change failed");
    }
    return updated as { id: string; status: string; slug: string };
  });

const OrderInput = z.object({
  listingId: z.string().uuid(),
  order: z.array(z.string().uuid()).min(1),
});

/** Persist gallery order; the first image becomes the primary/hero. */
export const reorderListingImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCanEditListing(supabase, userId, data.listingId);

    for (const [index, imageId] of data.order.entries()) {
      const { error } = await supabase
        .from("listing_images")
        .update({ sort_order: index, is_primary: index === 0 } as never)
        .eq("id", imageId)
        .eq("listing_id", data.listingId);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });
