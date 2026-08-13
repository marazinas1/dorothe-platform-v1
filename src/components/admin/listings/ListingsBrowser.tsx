import { useEffect, useMemo, useState } from "react";

import type { AdminListingRow } from "@/lib/listings/admin.functions";
import {
  EMPTY_FILTERS,
  filterAndSortListings,
  type ListingFilters,
} from "@/lib/listings/admin-list-filters";
import { shouldGroup } from "@/lib/listings/admin-list-groups";
import { ListingsToolbar, type ListingsView } from "./ListingsToolbar";
import { ListingsGrid } from "./ListingsGrid";
import { ListingsGroups } from "./ListingsGroups";
import { ListingsTable } from "./ListingsTable";

const VIEW_KEY = "admin.listings.view";

/** Toolbar + grid/table switcher; the view choice persists per browser. */
export function ListingsBrowser({
  rows,
  locale,
}: {
  rows: AdminListingRow[];
  locale: string;
}) {
  const [filters, setFilters] = useState<ListingFilters>(EMPTY_FILTERS);
  const [view, setView] = useState<ListingsView>("grid");

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "grid" || stored === "table") setView(stored);
  }, []);

  const changeView = (next: ListingsView) => {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  };

  const visible = useMemo(
    () => filterAndSortListings(rows, filters, locale),
    [rows, filters, locale],
  );

  const renderList = (list: AdminListingRow[]) =>
    view === "grid" ? (
      <ListingsGrid rows={list} locale={locale} />
    ) : (
      <ListingsTable rows={list} locale={locale} />
    );

  return (
    <div className="space-y-4">
      <ListingsToolbar
        filters={filters}
        onChange={setFilters}
        view={view}
        onViewChange={changeView}
        count={visible.length}
      />
      {shouldGroup(filters) ? (
        <ListingsGroups rows={visible} render={renderList} />
      ) : (
        renderList(visible)
      )}
    </div>
  );
}
