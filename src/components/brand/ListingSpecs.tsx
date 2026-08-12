import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatArea, formatPrice } from "@/lib/listings/format";
import { applies } from "@/lib/listings/field-visibility";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
};

/**
 * The full specification table, generated from the structured fields. This is
 * why the admin no longer asks anyone to retype "Baujahr 1998" as a bullet: the
 * broker enters the year once and the buyer-facing table writes itself.
 * Fields that do not apply to the property type are skipped entirely.
 */
export function ListingSpecs({ listing, locale, settings }: Props) {
  const { t, i18n } = useTranslation();
  const rows: { label: string; value: string }[] = [];
  const type = listing.property_type;

  const area = (value: number | null | undefined) =>
    value == null ? null : formatArea(value, settings.area_unit, locale);
  const num = (value: number | null | undefined) => (value == null ? null : String(value));

  function push(field: Parameters<typeof applies>[1], label: string, value: string | null) {
    if (!value || !applies(type, field)) return;
    rows.push({ label, value });
  }

  push("living_area", t("listings.detail.living_area"), area(listing.living_area));
  push(
    "usable_area",
    t(type === "commercial" ? "listings.detail.usable_area_commercial" : "listings.detail.usable_area"),
    area(listing.usable_area),
  );
  push("plot_area", t("listings.detail.plot_area"), area(listing.plot_area));
  push("rooms", t("listings.detail.rooms"), num(listing.rooms));
  push("bedrooms", t("listings.detail.bedrooms"), num(listing.bedrooms));
  push("bathrooms", t("listings.detail.bathrooms"), num(listing.bathrooms));
  push(
    "floor",
    t("listings.detail.floor"),
    listing.floor == null
      ? null
      : listing.total_floors
        ? `${listing.floor}/${listing.total_floors}`
        : String(listing.floor),
  );
  push("total_floors", t("listings.detail.total_floors"), num(listing.total_floors));
  push("year_built", t("listings.detail.year_built"), num(listing.year_built));
  push("year_renovated", t("listings.detail.year_renovated"), num(listing.year_renovated));
  push(
    "condition",
    t("listings.detail.condition"),
    listing.condition ? t(`listings.condition.${listing.condition}`) : null,
  );
  push(
    "heating_type",
    t("listings.detail.heating"),
    listing.heating_type ? t(`listings.heating.${listing.heating_type}`) : null,
  );
  push(
    "service_charge",
    t("listings.detail.service_charge"),
    listing.service_charge == null
      ? null
      : formatPrice(listing.service_charge, settings.currency, locale, {
          period: "month",
          onRequestLabel: "",
        }),
  );
  push(
    "availability_date",
    t("listings.detail.available_from"),
    listing.availability_date
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }).format(
          new Date(listing.availability_date),
        )
      : null,
  );
  push(
    "rental_status",
    t("listings.detail.rental_status"),
    listing.rental_status ? t(`listings.rentalStatus.${listing.rental_status}`) : null,
  );
  push("reference_code", t("listings.detail.reference"), listing.reference_code ?? null);

  if (rows.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
        {t("listings.detail.sections.specs")}
      </h2>
      <dl className="mt-8 grid gap-x-12 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-6 border-b border-border py-3"
          >
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
