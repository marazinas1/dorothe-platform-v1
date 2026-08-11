// Client-side filtering and sorting of the already-loaded admin listing list.
import type { AdminListingRow } from "./admin.functions";
import { pickLocalized } from "./format";

export const LISTING_SORTS = ["newest", "oldest", "price_desc", "price_asc"] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export type ListingFilters = {
  search: string;
  dealType: string;
  propertyType: string;
  status: string;
  sort: ListingSort;
};

export const EMPTY_FILTERS: ListingFilters = {
  search: "",
  dealType: "all",
  propertyType: "all",
  status: "all",
  sort: "newest",
};

function matchesSearch(row: AdminListingRow, needle: string, locale: string): boolean {
  if (!needle) return true;
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  const title = pickLocalized(row.title, locale).toLowerCase();
  const city = (row.address_city ?? "").toLowerCase();
  return title.includes(q) || city.includes(q);
}

export function filterAndSortListings(
  rows: AdminListingRow[],
  filters: ListingFilters,
  locale: string,
): AdminListingRow[] {
  const out = rows.filter(
    (row) =>
      matchesSearch(row, filters.search, locale) &&
      (filters.dealType === "all" || row.deal_type === filters.dealType) &&
      (filters.propertyType === "all" || row.property_type === filters.propertyType) &&
      (filters.status === "all" || row.status === filters.status),
  );

  const price = (row: AdminListingRow) => (row.price == null ? -1 : Number(row.price));
  const time = (row: AdminListingRow) => new Date(row.updated_at).getTime();

  return out.sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return time(a) - time(b);
      case "price_desc":
        return price(b) - price(a);
      case "price_asc":
        return price(a) - price(b);
      default:
        return time(b) - time(a);
    }
  });
}
