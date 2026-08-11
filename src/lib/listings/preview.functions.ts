// Listing preview: mint a signed link (admin, permission-checked) and resolve
// it on the public detail route (token-checked, never authenticated).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PublicListing } from "./queries.functions";

/** Signed-in editor asks for a preview URL of a listing they may edit. */
export const createListingPreviewLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ slug: string; token: string }> => {
    const { supabase, userId } = context;
    const { assertCanEditListing } = await import("./admin.server");
    await assertCanEditListing(supabase, userId, data.id);

    const { data: row, error } = await supabase
      .from("listings")
      .select("slug")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row?.slug) {
      throw new Response(error?.message ?? "Not found", { status: 404 });
    }

    const { createPreviewToken } = await import("./preview.server");
    return { slug: row.slug as string, token: await createPreviewToken(row.slug as string) };
  });

/**
 * Resolves a preview token during SSR of the public detail route. An invalid,
 * expired or missing token returns null, so the route falls back to 404.
 */
export const getListingPreview = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1), token: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicListing | null> => {
    const { verifyPreviewToken, loadPreviewListing } = await import("./preview.server");
    if (!(await verifyPreviewToken(data.slug, data.token))) return null;
    return loadPreviewListing(data.slug);
  });
