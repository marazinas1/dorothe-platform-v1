import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Counts one render of a public listing detail page.
 *
 * Called exactly once per navigation from the route loader: during SSR it runs
 * in-process on the server, and on a client-side navigation the browser calls
 * it over RPC. Hydration does not re-run the loader, so the two paths never
 * both fire for the same page view. Failures are swallowed — counting must
 * never break a page.
 */
export const countListingView = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ listing_id: z.string().uuid() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { isCountableView, bumpViewCount } = await import("./views.server");
    if (!isCountableView()) return { counted: false };
    try {
      await bumpViewCount(data.listing_id);
      return { counted: true };
    } catch {
      return { counted: false };
    }
  });
