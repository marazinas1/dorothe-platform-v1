// Auto-draft lifecycle. "New listing" creates the row immediately so photos can
// be uploaded before anything is filled in; the price of that convenience is
// abandoned empty drafts, which are cleaned up opportunistically when the list
// screen loads. Status changes stay explicit — autosave never publishes.
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Empty drafts older than this are removed on the next admin list load. */
const JUNK_AGE_HOURS = 24;

export const createAutoDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    const { assertPermission } = await import("@/lib/auth/require-permission.server");
    await assertPermission(supabase, userId, "listing.create");

    // Country and region come from configuration, never from code.
    const { data: settings } = await supabase
      .from("site_settings")
      .select("country, address_country")
      .limit(1)
      .maybeSingle();

    const { data: created, error } = await supabase
      .from("listings")
      .insert({
        status: "draft",
        created_from_autodraft: true,
        deal_type: "sale",
        property_type: "apartment",
        geo_precision: "approximate",
        address_country: settings?.address_country ?? settings?.country ?? null,
      } as never)
      .select("id")
      .maybeSingle();
    if (error || !created) {
      throw new Response(error?.message ?? "Could not create draft", { status: 400 });
    }
    return created as { id: string };
  });

/**
 * Delete auto-created drafts that were never touched: no title, no photos,
 * untouched for a day. Anything the user actually typed into is kept.
 */
export const cleanupAbandonedDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ removed: number }> => {
    const { supabase } = context;
    const cutoff = new Date(Date.now() - JUNK_AGE_HOURS * 3600_000).toISOString();

    const { data: candidates, error } = await supabase
      .from("listings")
      .select("id, title, description, address_city, price, listing_images(id)")
      .eq("status", "draft")
      .eq("created_from_autodraft", true)
      .lt("updated_at", cutoff)
      .limit(50);
    if (error || !candidates?.length) return { removed: 0 };

    const empty = candidates.filter((row) => {
      const untitled = Object.keys((row.title ?? {}) as object).length === 0;
      const undescribed = Object.keys((row.description ?? {}) as object).length === 0;
      const noImages = ((row.listing_images ?? []) as unknown[]).length === 0;
      return untitled && undescribed && noImages && !row.address_city && row.price == null;
    });
    if (empty.length === 0) return { removed: 0 };

    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .in(
        "id",
        empty.map((row) => row.id),
      );
    if (deleteError) return { removed: 0 };
    return { removed: empty.length };
  });
