import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ImageOff } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pickLocalized, formatPrice } from "@/lib/listings/format";
import type { AdminListingRow } from "@/lib/listings/admin.functions";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import type { Locale } from "@/i18n/config";
import { variantUrl } from "./listing-image-url";
import { ListingRowActions } from "./ListingRowActions";

function primaryThumb(row: AdminListingRow): string | null {
  const sorted = [...(row.images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const primary = sorted.find((i) => i.is_primary) ?? sorted[0];
  return primary ? variantUrl(primary.variants, "thumb") : null;
}

export function ListingsTable({
  rows,
  locale,
}: {
  rows: AdminListingRow[];
  locale: string;
}) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[88px]" />
            <TableHead>{t("admin.listings.fields.title")}</TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("admin.listings.fields.address_city")}
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {t("admin.listings.fields.price")}
            </TableHead>
            <TableHead>{t("admin.listings.fields.status")}</TableHead>
            <TableHead className="text-right">{t("admin.listings.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const thumb = primaryThumb(row);
            return (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    to="/$locale/admin/listings/$id"
                    params={{ locale, id: row.id }}
                    className="block h-14 w-20 overflow-hidden rounded border border-border bg-muted"
                  >
                    {thumb ? (
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-4 w-4 text-muted-foreground/70" />
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    to="/$locale/admin/listings/$id"
                    params={{ locale, id: row.id }}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {pickLocalized(row.title, locale) || t("admin.listings.untitled")}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {t(`listings.propertyType.${row.property_type}`)} ·{" "}
                    {t(`listings.dealType.${row.deal_type}`)}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {row.address_city ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {formatPrice(row.price, settings.currency, locale as Locale, {
                    onRequest: row.price_on_request,
                    onRequestLabel: t("listings.on_request"),
                  })}
                </TableCell>
                <TableCell>
                  <span className="flex items-center gap-2 text-[13px] tracking-[0.01em]">
                    <span
                      aria-hidden
                      className={
                        row.status === "active" || row.status === "coming_soon"
                          ? "h-1.5 w-1.5 rounded-full bg-primary"
                          : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
                      }
                    />
                    {t(`listings.status.${row.status}`)}
                  </span>
                  {(row.images ?? []).length === 0 ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {t("admin.listings.noImages")}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <ListingRowActions id={row.id} status={row.status} locale={locale} />
                </TableCell>
              </TableRow>

            );
          })}
        </TableBody>
      </Table>
      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          {t("admin.listings.empty")}
        </p>
      ) : null}
    </div>
  );
}
