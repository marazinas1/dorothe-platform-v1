import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatArea, formatPrice } from "@/lib/listings/format";
import { moneyLabelKey } from "@/lib/listings/field-labels";
import { commissionRow } from "@/lib/listings/commission";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
  /** Anchor of the enquiry form. */
  contactHref: string;
};

/**
 * Desktop-only aside: the price, the two or three figures a buyer checks
 * against it, and the way to ask. It stays with the reader through the long
 * middle of the page and is released once the enquiry form is on screen.
 */
export function ListingStickyRail({ listing, locale, settings, contactHref }: Props) {
  const { t } = useTranslation();
  const shape = { property_type: listing.property_type, deal_type: listing.deal_type };

  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const commission = commissionRow(listing, settings.currency, locale, t);

  const figures: Array<{ label: string; value: string }> = [];
  const area = listing.property_type === "land" ? listing.plot_area : listing.living_area;
  if (area != null) {
    figures.push({
      label: t(
        listing.property_type === "land"
          ? "listings.detail.plot_area"
          : "listings.detail.living_area",
      ),
      value: formatArea(area, settings.area_unit, locale),
    });
  }
  if (listing.rooms != null) {
    figures.push({ label: t("listings.detail.rooms"), value: String(listing.rooms) });
  }
  if (listing.total_rent != null) {
    figures.push({
      label: t(moneyLabelKey(shape, "total_rent", "public")),
      value: formatPrice(listing.total_rent, settings.currency, locale, {
        period: "month",
        onRequestLabel: "",
      }),
    });
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28 border-t border-border pt-6">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {t(moneyLabelKey(shape, "price", "public"))}
        </div>
        <div className="mt-3 font-heading text-4xl leading-none tabular-figures">
          {price}
        </div>

        {commission ? (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {t(commission.labelKey)}: {commission.value}
          </p>
        ) : null}

        <dl className="mt-8">
          {figures.map((f) => (
            <div
              key={f.label}
              className="flex items-baseline justify-between gap-4 border-b border-border py-3"
            >
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {f.label}
              </dt>
              <dd className="tabular-figures text-sm">{f.value}</dd>
            </div>
          ))}
        </dl>

        <a
          href={contactHref}
          className="mt-8 inline-flex w-full items-center justify-center rounded-control bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity duration-300 hover:opacity-90"
        >
          {t("listings.detail.contact_agent")}
        </a>
        {listing.reference_code ? (
          <div className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("listings.detail.reference_short")} {listing.reference_code}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
