// Cleanup safety net for auto-created drafts. Rows are now created lazily, on
// the first meaningful action in the editor, so an empty auto-draft can only
// exist if a save failed midway. One hour is enough slack for a client that is
// mid-upload or offline, and short enough that junk never lingers in the list.
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Empty drafts older than this are removed on the next admin list load. */
const JUNK_AGE_HOURS = 1;
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
