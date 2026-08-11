import { useTranslation } from "react-i18next";
import { LayoutGrid, Table2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEAL_TYPES,
  LISTING_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/listings/admin-schema";
import {
  LISTING_SORTS,
  type ListingFilters,
  type ListingSort,
} from "@/lib/listings/admin-list-filters";

export type ListingsView = "grid" | "table";

export function ListingsToolbar({
  filters,
  onChange,
  view,
  onViewChange,
  count,
}: {
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
  view: ListingsView;
  onViewChange: (next: ListingsView) => void;
  count: number;
}) {
  const { t } = useTranslation();
  const set = (patch: Partial<ListingFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder={t("admin.listings.toolbar.searchReference")}
          aria-label={t("admin.listings.toolbar.search")}
          className="h-9 w-full sm:w-56"
        />

        <Select value={filters.dealType} onValueChange={(v) => set({ dealType: v })}>
          <SelectTrigger className="h-9 w-[150px]" aria-label={t("admin.listings.fields.deal_type")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.listings.toolbar.allDealTypes")}</SelectItem>
            {DEAL_TYPES.map((d) => (
              <SelectItem key={d} value={d}>
                {t(`listings.dealType.${d}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.propertyType}
          onValueChange={(v) => set({ propertyType: v })}
        >
          <SelectTrigger
            className="h-9 w-[160px]"
            aria-label={t("admin.listings.fields.property_type")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.listings.toolbar.allPropertyTypes")}</SelectItem>
            {PROPERTY_TYPES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`listings.propertyType.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger className="h-9 w-[150px]" aria-label={t("admin.listings.fields.status")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.listings.toolbar.allStatuses")}</SelectItem>
            {LISTING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`listings.status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(v) => set({ sort: v as ListingSort })}
        >
          <SelectTrigger className="h-9 w-[170px]" aria-label={t("admin.listings.toolbar.sort")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LISTING_SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`admin.listings.toolbar.sortOptions.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as ListingsView)}
          className="ml-auto"
        >
          <ToggleGroupItem value="grid" aria-label={t("admin.listings.toolbar.gridView")}>
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label={t("admin.listings.toolbar.tableView")}>
            <Table2 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("admin.listings.toolbar.count", { count })}
      </p>
    </div>
  );
}
