import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatArea, formatPrice } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
};

type Fact = { label: string; value: string };

/**
 * Key figures as a calm label/value table: hairline dividers, tabular
 * figures, no boxes or shadows. Price sits above as the prominent line
 * and honours price_on_request.
 */
export function ListingFactsBar({ listing, locale, settings }: Props) {
  const { t } = useTranslation();
  const facts: Fact[] = [];
  // A sale listing that is currently let is an investment property: the tenancy
  // passes to the buyer. Independent of deal_type, never derived from it.
  const investment = listing.deal_type === "sale" && listing.rental_status === "let";

  if (listing.living_area != null) {
    facts.push({
      label: t("listings.detail.living_area"),
      value: formatArea(listing.living_area, settings.area_unit, locale),
    });
  }
  if (listing.plot_area != null) {
    facts.push({
      label: t("listings.detail.plot_area"),
      value: formatArea(listing.plot_area, settings.area_unit, locale),
    });
  }
  if (listing.rooms != null) {
    facts.push({ label: t("listings.detail.rooms"), value: String(listing.rooms) });
  }
  if (listing.bedrooms != null) {
    facts.push({ label: t("listings.detail.bedrooms"), value: String(listing.bedrooms) });
  }
  if (listing.bathrooms != null) {
    facts.push({
      label: t("listings.detail.bathrooms"),
      value: String(listing.bathrooms),
    });
  }
  if (listing.floor != null) {
    facts.push({
      label: t("listings.detail.floor"),
      value: listing.total_floors
        ? `${listing.floor}/${listing.total_floors}`
        : String(listing.floor),
    });
  }
  if (listing.year_built != null) {
    facts.push({
      label: t("listings.detail.year_built"),
      value: String(listing.year_built),
    });
  }

  if (listing.condition) {
    facts.push({
      label: t("listings.detail.condition"),
      value: t(`listings.condition.${listing.condition}`),
    });
  }
  if (listing.heating_type) {
    facts.push({
      label: t("listings.detail.heating"),
      value: t(`listings.heating.${listing.heating_type}`),
    });
  }

  if (listing.service_charge != null) {
    facts.push({
      label: t("listings.detail.service_charge"),
      value: formatPrice(listing.service_charge, settings.currency, locale, { onRequestLabel: "" }),
    });
  }
  if (listing.commission_value != null) {
    facts.push({
      label: t("listings.detail.commission"),
      value: [
        listing.commission_type === "amount"
          ? formatPrice(listing.commission_value, settings.currency, locale, { onRequestLabel: "" })
          : `${listing.commission_value} %`,
        listing.commission_payer
          ? t(`listings.detail.commission_payer.${listing.commission_payer}`)
          : "",
      ]
        .filter(Boolean)
        .join(" \u00b7 "),
    });
  }
  if (listing.rental_status) {
    facts.push({
      label: t("listings.detail.rental_status"),
      value: t(
        listing.rental_status === "let"
          ? "listings.detail.rental_let"
          : "listings.detail.rental_vacant",
      ),
    });
  }
  if (listing.availability_date) {
    facts.push({
      label: t("listings.detail.availability"),
      value: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(listing.availability_date),
      ),
    });
  } else if (investment) {
    facts.push({
      label: t("listings.detail.availability"),
      value: t("listings.detail.availability_after_tenancy"),
    });
  }

  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
      <div className="border-t border-border pt-6">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale")}
        </div>
        <div className="mt-4 font-heading text-4xl leading-none tabular-figures md:text-5xl">
          {price}
        </div>
        {investment ? (
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("listings.detail.investment_note")}
          </p>
        ) : null}
      </div>

      <dl className="border-t border-border">
        {facts.map((f) => (
          <div
            key={f.label}
            className="flex items-baseline justify-between gap-6 border-b border-border py-4"
          >
            <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {f.label}
            </dt>
            <dd className="tabular-figures text-base text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
