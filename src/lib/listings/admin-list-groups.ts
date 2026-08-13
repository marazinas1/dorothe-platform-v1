// Grouping of the admin listing list by lifecycle stage: what needs attention
// first, closed business last. Only used when no filter narrows the list.
import type { AdminListingRow } from "./admin.functions";
import { EMPTY_FILTERS, type ListingFilters } from "./admin-list-filters";

export const STATUS_GROUP_KEYS = [
  "active",
  "coming_soon",
  "reserved",
  "closed",
  "draft",
  "archived",
] as const;

export type StatusGroupKey = (typeof STATUS_GROUP_KEYS)[number];

const MEMBERS: Record<StatusGroupKey, string[]> = {
  active: ["active"],
  coming_soon: ["coming_soon"],
  reserved: ["reserved"],
  closed: ["sold", "rented"],
  draft: ["draft"],
  archived: ["archived"],
};

export type ListingGroup = {
  key: StatusGroupKey;
  rows: AdminListingRow[];
  /** History rather than work: rendered collapsed. */
  collapsedByDefault: boolean;
};

/** Non-empty groups, in fixed order. */
export function groupListingsByStatus(rows: AdminListingRow[]): ListingGroup[] {
  return STATUS_GROUP_KEYS.map((key) => ({
    key,
    rows: rows.filter((row) => MEMBERS[key].includes(row.status)),
    collapsedByDefault: key === "archived",
  })).filter((group) => group.rows.length > 0);
}

/** Grouping only helps the unfiltered list; a filtered result stays flat. */
export function shouldGroup(filters: ListingFilters): boolean {
  return (
    filters.search.trim() === "" &&
    filters.dealType === EMPTY_FILTERS.dealType &&
    filters.propertyType === EMPTY_FILTERS.propertyType &&
    filters.status === EMPTY_FILTERS.status
  );
}
