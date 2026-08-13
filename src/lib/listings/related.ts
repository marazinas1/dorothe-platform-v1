// Selecting "other properties you might like".
//
// The catalogue query legitimately includes sold and rented listings — the sold
// archive is built on it. Related properties must not: presenting a sold house
// as an alternative offers something that does not exist. So related is
// restricted to listings a visitor can actually enquire about.
//
// `reserved` is excluded. A reserved property is in final negotiation; showing
// it as an alternative sends the reader to a dead end, and if it falls through
// it becomes active again on its own. `coming_soon` is included: it is
// pre-market but genuinely enquirable, and for a small portfolio it is often
// the strongest thing on offer.
export const RELATED_STATUSES = ["active", "coming_soon"] as const;

/** Below this, the block hides rather than rendering one card beside two gaps. */
export const RELATED_MIN = 2;
export const RELATED_MAX = 3;

type Candidate = {
  id: string;
  status: string;
  deal_type: string;
  address_city: string | null;
  price: number | null;
};

/**
 * Ranks candidates against the listing being read: same town first, then
 * closest price. The status filter is applied here as well as in the query, so
 * a caller that passes a wider list cannot leak a sold listing into the block.
 */
export function selectRelated<T extends Candidate>(current: Candidate, candidates: T[]): T[] {
  const allowed = new Set<string>(RELATED_STATUSES);
  const town = (current.address_city ?? "").trim().toLowerCase();

  const pool = candidates.filter(
    (c) =>
      c.id !== current.id &&
      allowed.has(c.status) &&
      // A buyer and a tenant are not looking for the same thing.
      c.deal_type === current.deal_type,
  );

  const scored = pool.map((c) => {
    const sameTown = (c.address_city ?? "").trim().toLowerCase() === town && town.length > 0;
    const priceGap =
      current.price != null && c.price != null
        ? Math.abs(c.price - current.price) / Math.max(current.price, 1)
        : Number.POSITIVE_INFINITY;
    return { c, sameTown, priceGap };
  });

  scored.sort((a, b) => {
    if (a.sameTown !== b.sameTown) return a.sameTown ? -1 : 1;
    if (a.priceGap !== b.priceGap) return a.priceGap - b.priceGap;
    return 0;
  });

  const picked = scored.slice(0, RELATED_MAX).map((s) => s.c);
  return picked.length >= RELATED_MIN ? picked : [];
}
