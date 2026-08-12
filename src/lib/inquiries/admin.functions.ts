// Admin-side inquiry server functions. All reads run as the signed-in user so
// RLS decides visibility; every endpoint additionally asserts the permission.
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCanViewInquiries, signSellerPhotos } from "./admin.server";
import { INQUIRY_STATUSES, type AdminInquiryRow } from "./types";

const COLUMNS =
  "id, type, status, name, email, phone, message, locale, source, payload, photo_paths, listing_id, created_at, read_at, handled_at, listings(id, slug, title)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shape(row: any): AdminInquiryRow {
  const { listings, ...rest } = row;
  return {
    ...rest,
    photo_paths: rest.photo_paths ?? [],
    listing: listings ?? null,
  } as AdminInquiryRow;
}

export const listInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInquiryRow[]> => {
    await assertCanViewInquiries(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("inquiries")
      .select(COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(shape);
  });

export const adminInquiriesQueryOptions = queryOptions({
  queryKey: ["admin", "inquiries"],
  queryFn: () => listInquiries(),
});

/** Badge count for the sidebar. Returns 0 when the caller may not view. */
export const countNewInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<number> => {
    const { count, error } = await context.supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    if (error) return 0;
    return count ?? 0;
  });

export const newInquiryCountQueryOptions = queryOptions({
  queryKey: ["admin", "inquiries", "new-count"],
  queryFn: () => countNewInquiries(),
  staleTime: 60_000,
});

export interface AdminInquiryDetail {
  inquiry: AdminInquiryRow;
  photoUrls: string[];
}

/** Loads one inquiry and marks it read on first open. */
export const getInquiry = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<AdminInquiryDetail> => {
    const { supabase, userId } = context;
    await assertCanViewInquiries(supabase, userId);

    const { data: row, error } = await supabase
      .from("inquiries")
      .select(COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    const inquiry = shape(row);

    if (inquiry.status === "new") {
      const { data: updated } = await supabase
        .from("inquiries")
        .update({ status: "read", read_at: new Date().toISOString() } as never)
        .eq("id", inquiry.id)
        .select("status, read_at")
        .maybeSingle();
      if (updated) {
        inquiry.status = "read";
        inquiry.read_at = (updated as { read_at: string | null }).read_at;
      }
    }

    const photoUrls = await signSellerPhotos(inquiry.photo_paths ?? []);
    return { inquiry, photoUrls };
  });

export function adminInquiryQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["admin", "inquiry", id],
    queryFn: () => getInquiry({ data: { id } }),
  });
}

export const setInquiryStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ id: z.string().uuid(), status: z.enum(INQUIRY_STATUSES) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertCanViewInquiries(supabase, userId);
    const patch = {
      status: data.status,
      handled_at: data.status === "handled" ? new Date().toISOString() : null,
    };
    const { data: updated, error } = await supabase
      .from("inquiries")
      .update(patch as never)
      .eq("id", data.id)
      .select("id, status, handled_at")
      .maybeSingle();
    if (error || !updated) {
      throw new Error(error?.message ?? "Status change failed");
    }
    return updated as { id: string; status: string; handled_at: string | null };
  });
