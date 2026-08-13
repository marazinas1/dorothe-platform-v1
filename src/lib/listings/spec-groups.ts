// The public specification, grouped. A buyer reads a listing in blocks — size,
// then building, then what it costs, then the terms — so the rows are grouped
// here instead of arriving as one 20-row table. Which rows exist at all is
// still decided by the visibility matrix, so a plot never shows a bathroom
// count and a rental never shows a Hausgeld.
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

import { applies, type ListingShape, type VisibleField } from "./field-visibility";
import { moneyLabelKey } from "./field-labels";
import { formatArea, formatPrice } from "./format";
import { commissionRow, type CommissionInput } from "./commission";

export type SpecRow = { label: string; value: string };
export type SpecGroup = { titleKey: string; rows: SpecRow[] };

type Translate = (key: string, vars?: Record<string, unknown>) => string;

export type SpecInput = CommissionInput & {
  property_type: string;
  deal_type: string;
  living_area: number | null;
  usable_area: number | null;
  plot_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  year_renovated: number | null;
  condition: string | null;
  heating_type: string | null;
  price: number | null;
  price_on_request: boolean | null;
  price_period: string | null;
  service_charge: number | null;
  utilities_cost: number | null;
  heating_costs_included: boolean | null;
  total_rent: number | null;
  deposit: number | null;
  rental_status: string | null;
  availability_date: string | null;
  reference_code: string | null;
};

export function specGroups(
  listing: SpecInput,
  settings: SiteSettings,
  locale: Locale,
  t: Translate,
): SpecGroup[] {
  const shape: ListingShape = {
    property_type: listing.property_type,
    deal_type: listing.deal_type,
  };
  const monthly = listing.deal_type === "rent" ? "month" : null;

  const area = (value: number | null) =>
    value == null ? null : formatArea(value, settings.area_unit, locale);
  const num = (value: number | null) => (value == null ? null : String(value));
  const money = (value: number | null, period: string | null = null) =>
    value == null
      ? null
      : formatPrice(value, settings.currency, locale, { period, onRequestLabel: "" });

  function group(titleKey: string, entries: Array<[VisibleField | null, string, string | null]>) {
    const rows: SpecRow[] = [];
    for (const [field, label, value] of entries) {
      if (!value) continue;
      if (field && !applies(shape, field)) continue;
      rows.push({ label, value });
    }
    return { titleKey, rows };
  }

  const size = group("listings.detail.sections.size", [
    ["living_area", t("listings.detail.living_area"), area(listing.living_area)],
    [
      "usable_area",
      t(
        listing.property_type === "commercial"
          ? "listings.detail.usable_area_commercial"
          : "listings.detail.usable_area",
      ),
      area(listing.usable_area),
    ],
    ["plot_area", t("listings.detail.plot_area"), area(listing.plot_area)],
    ["rooms", t("listings.detail.rooms"), num(listing.rooms)],
    ["bedrooms", t("listings.detail.bedrooms"), num(listing.bedrooms)],
    ["bathrooms", t("listings.detail.bathrooms"), num(listing.bathrooms)],
  ]);

  const building = group("listings.detail.sections.building", [
    [
      "floor",
      t("listings.detail.floor"),
      listing.floor == null
        ? null
        : listing.total_floors
          ? `${listing.floor}/${listing.total_floors}`
          : String(listing.floor),
    ],
    ["total_floors", t("listings.detail.total_floors"), num(listing.total_floors)],
    ["year_built", t("listings.detail.year_built"), num(listing.year_built)],
    ["year_renovated", t("listings.detail.year_renovated"), num(listing.year_renovated)],
    [
      "condition",
      t("listings.detail.condition"),
      listing.condition ? t(`listings.condition.${listing.condition}`) : null,
    ],
    [
      "heating_type",
      t("listings.detail.heating"),
      listing.heating_type ? t(`listings.heating.${listing.heating_type}`) : null,
    ],
  ]);

  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });

  const costEntries: Array<[VisibleField | null, string, string | null]> = [
    [null, t(moneyLabelKey(shape, "price", "public")), price],
    [
      "service_charge",
      t(moneyLabelKey(shape, "service_charge", "public")),
      money(listing.service_charge, "month"),
    ],
    [
      "utilities_cost",
      t(moneyLabelKey(shape, "utilities_cost", "public")),
      money(listing.utilities_cost, "month"),
    ],
    [
      "heating_costs_included",
      t("listings.detail.heating_costs"),
      listing.heating_costs_included == null
        ? null
        : t(
            listing.heating_costs_included
              ? "listings.detail.heating_costs_included"
              : "listings.detail.heating_costs_excluded",
          ),
    ],
    [
      "total_rent",
      t(moneyLabelKey(shape, "total_rent", "public")),
      money(listing.total_rent, monthly),
    ],
    ["deposit", t(moneyLabelKey(shape, "deposit", "public")), money(listing.deposit)],
  ];
  // The commission row is never dropped for a rental: see commission.ts.
  const commission = commissionRow(listing, settings.currency, locale, t);
  if (commission && applies(shape, "commission")) {
    costEntries.push([null, t(commission.labelKey), commission.value]);
  }
  const costs = group("listings.detail.sections.costs", costEntries);

  const terms = group("listings.detail.sections.terms", [
    [
      "availability_date",
      t("listings.detail.available_from"),
      listing.availability_date
        ? new Intl.DateTimeFormat(locale === "en" ? "en-US" : "de-DE", {
            dateStyle: "long",
          }).format(new Date(listing.availability_date))
        : null,
    ],
    [
      "rental_status",
      t("listings.detail.rental_status"),
      listing.rental_status ? t(`listings.rentalStatus.${listing.rental_status}`) : null,
    ],
    ["reference_code", t("listings.detail.reference"), listing.reference_code],
  ]);

  return [size, building, costs, terms].filter((g) => g.rows.length > 0);
}
