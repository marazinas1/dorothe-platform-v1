import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { AdminListingRow } from "@/lib/listings/admin.functions";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { ListingCardTile } from "./ListingCardTile";

export function ListingsGrid({
  rows,
  locale,
}: {
  rows: AdminListingRow[];
  locale: string;
}) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {t("admin.listings.empty")}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <ListingCardTile
          key={row.id}
          row={row}
          locale={locale}
          currency={settings.currency}
        />
      ))}
    </div>
  );
}
