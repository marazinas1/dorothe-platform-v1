import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";

import { pickLocalized, formatPrice, formatArea } from "@/lib/listings/format";
import type { AdminListingRow } from "@/lib/listings/admin.functions";
import type { Locale } from "@/i18n/config";
import { variantUrl } from "./listing-image-url";
import { ListingRowActions } from "./ListingRowActions";
import { ListingCardActions } from "./ListingCardActions";

function coverUrl(row: AdminListingRow): string | null {
  const sorted = [...(row.images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const primary = sorted.find((i) => i.is_primary) ?? sorted[0];
  return primary ? variantUrl(primary.variants, "card") : null;
}

export function ListingCardTile({
  row,
  locale,
  currency,
}: {
  row: AdminListingRow;
  locale: string;
  currency: string;
}) {
  const { t } = useTranslation();
  const cover = coverUrl(row);
  const isLive = row.status === "active" || row.status === "coming_soon";

  const figures = [
    row.rooms != null ? `${row.rooms} ${t("admin.listings.figures.rooms")}` : null,
    row.bedrooms != null ? `${row.bedrooms} ${t("admin.listings.figures.bedrooms")}` : null,
    row.bathrooms != null ? `${row.bathrooms} ${t("admin.listings.figures.bathrooms")}` : null,
    row.living_area != null ? formatArea(row.living_area, "sqm", locale as Locale) : null,
  ].filter(Boolean) as string[];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Link
        to="/$locale/admin/listings/$id"
        params={{ locale, id: row.id }}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground/70">
            <ImageOff className="h-5 w-5" />
            <span className="text-[11px]">{t("admin.listings.noImages")}</span>
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] tracking-[0.02em] text-foreground backdrop-blur-sm">
          <span
            aria-hidden
            className={
              isLive
                ? "h-1.5 w-1.5 rounded-full bg-primary"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/40"
            }
          />
          {t(`listings.status.${row.status}`)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link
            to="/$locale/admin/listings/$id"
            params={{ locale, id: row.id }}
            className="font-heading text-base underline-offset-4 hover:underline"
          >
            {pickLocalized(row.title, locale) || t("admin.listings.untitled")}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t(`listings.propertyType.${row.property_type}`)}
            {row.address_city ? ` · ${row.address_city}` : ""}
            {` · ${t(`listings.dealType.${row.deal_type}`)}`}
          </p>
        </div>

        {figures.length > 0 ? (
          <p className="text-xs text-muted-foreground">{figures.join(" · ")}</p>
        ) : null}

        <p className="text-sm">
          {formatPrice(row.price, currency, locale as Locale, {
            onRequest: row.price_on_request,
            onRequestLabel: t("listings.on_request"),
          })}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <ListingCardActions id={row.id} slug={row.slug} locale={locale} />
          <ListingRowActions id={row.id} status={row.status} locale={locale} />
        </div>
      </div>
    </article>
  );
}
