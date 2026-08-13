import { useEffect, useRef } from "react";

import { countListingView } from "@/lib/listings/views.functions";

/**
 * Counts a client-side navigation to a listing page, once per mounted page.
 *
 * Server-rendered visits are already counted in the route loader, so those
 * pass `skip` and the effect stays silent — that is what keeps every number
 * from doubling at hydration. Preloaded routes never mount, so hovering a
 * card counts nothing.
 */
export function useCountListingView(
  listingId: string | undefined,
  options: { skip?: boolean } = {},
) {
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (!listingId || options.skip) return;
    if (counted.current === listingId) return;
    counted.current = listingId;
    void countListingView({ data: { listing_id: listingId } }).catch(() => {});
  }, [listingId, options.skip]);
}
