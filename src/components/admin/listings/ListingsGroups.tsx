import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

import type { AdminListingRow } from "@/lib/listings/admin.functions";
import { groupListingsByStatus } from "@/lib/listings/admin-list-groups";

/**
 * Lifecycle sections with a heading and a count. Empty groups are skipped, and
 * history (archived) opens collapsed.
 */
export function ListingsGroups({
  rows,
  render,
}: {
  rows: AdminListingRow[];
  render: (rows: AdminListingRow[]) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const groups = groupListingsByStatus(rows);

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {t("admin.listings.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <details key={group.key} open={!group.collapsedByDefault} className="group">
          <summary className="mb-3 flex cursor-pointer list-none items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t(`admin.listings.statusGroups.${group.key}`)}
            </span>
            <span className="text-[11px] text-muted-foreground/70">{group.rows.length}</span>
          </summary>
          {render(group.rows)}
        </details>
      ))}
    </div>
  );
}
