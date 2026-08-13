import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { ListingCardCarousel } from "@/components/brand/ListingCardCarousel";
import { ListingCardSpecs } from "@/components/brand/ListingCardSpecs";
import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { formatDate, formatPrice } from "@/lib/listings/format";
import { listingDisplayName, listingHeadline } from "@/lib/listings/display-title";
import { moneyLabelKey } from "@/lib/listings/field-labels";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
  size?: "large" | "compact";
  /** Suppress the price row (achieved prices on closed properties). */
  hidePrice?: boolean;
  /** Above-the-fold rows may load their cover eagerly. */
  eager?: boolean;
};

/**
 * The one listing card: homepage, catalogue, sold archive and the agent block
 * all render this, so the sold emphasis is a prop (`hidePrice`), not a copy.
 *
 * Structure is an <article> with the real <a> on the headline; that link spreads
 * an inset-0 pseudo-element over the whole card, which is why the entire surface
 * is clickable while the card stays valid HTML with a single tab stop. Carousel
 * controls sit above that overlay, so they need no click guards.
 *
 * Every zone has reserved height (media aspect, spec row, two-line title, two
 * line description) and the price is pinned with mt-auto, so neighbours in a row
 * always end at the same height whatever data they carry.
 */
export function ListingCard({
  listing,
  locale,
  settings,
  size = "large",
  hidePrice = false,
  eager = false,
}: Props) {
  const { t } = useTranslation();
  const drag = useRef<{ x: number; y: number } | null>(null);

  const headline = listingHeadline(listing, locale);
  // Never the slug: a title-less listing shows no headline, and the link still
  // needs a name, so it gets a descriptive one ("Wohnung in Kevelaer").
  const linkName = listingDisplayName(listing, locale, t);
  const description = listingHeadline({ title: listing.description }, locale);
  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const status = statusLabel(listing, t);
  const priceLabel = t(
    moneyLabelKey(
      { property_type: listing.property_type, deal_type: listing.deal_type },
      "price",
      "public",
    ),
  );

  return (
    <article
      // A swipe that ends on the media must not follow the card link.
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY };
      }}
      onClickCapture={(e) => {
        const start = drag.current;
        drag.current = null;
        if (!start) return;
        const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (moved > 8) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={
        size === "large"
          ? "group relative flex h-full flex-col rounded-media border border-border/70 bg-card p-3 md:p-4"
          : "group relative flex h-full flex-col rounded-media border border-border/70 bg-card p-2 md:p-3"
      }
    >
      <ListingCardCarousel
        images={listing.images}
        locale={locale}
        name={linkName}
        eager={eager}
      />

      <div
        className={
          size === "large"
            ? "flex flex-1 flex-col px-2 pt-5 pb-2 md:px-3"
            : "flex flex-1 flex-col px-1.5 pt-4 pb-1 md:px-2"
        }
      >
        <div className="flex items-baseline justify-between gap-4">
          <span className={status.accent ? "eyebrow text-primary" : "eyebrow text-muted-foreground"}>
            {status.label}
          </span>
          <span className="eyebrow text-muted-foreground">{listing.address_city}</span>
        </div>

        <div className="mt-4">
          <ListingCardSpecs
            listing={listing}
            areaUnit={settings.area_unit}
            locale={locale}
          />
        </div>

        <h3
          className={
            size === "large"
              ? "mt-4 line-clamp-3 min-h-[3.75em] font-heading text-2xl leading-tight text-foreground md:text-[1.75rem]"
              : "mt-4 line-clamp-2 min-h-[2.5em] font-heading text-xl leading-tight text-foreground md:text-2xl"
          }
          title={headline || undefined}
        >
          <Link
            to="/$locale/immobilien/$slug"
            params={{ locale, slug: listing.slug }}
            aria-label={headline ? undefined : linkName}
            className="transition-opacity duration-300 before:absolute before:inset-0 before:z-10 before:content-[''] group-hover:opacity-80"
          >
            {/* No headline for a title-less listing, but the link (and its
                inset overlay) is still here, so the card stays clickable. */}
            {headline}
          </Link>
        </h3>

        {/* The compact card is a proof point, not a pitch: no description. */}
        {size === "large" ? (
          <p className="mt-2 line-clamp-2 min-h-[3.25em] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-auto flex items-baseline justify-between gap-6 border-t border-border/70 pt-4 text-sm">
          {/* On closed properties the price row disappears rather than reading
              "on request" — the sale is over, there is nothing to ask. */}
          {hidePrice ? (
            <span />
          ) : (
            <span className="font-body text-foreground">
              <span className="text-muted-foreground">{priceLabel}</span>{" "}
              <span className="tabular-figures">{price}</span>
            </span>
          )}
          {listing.status === "sold" && listing.sold_at ? (
            <span className="text-xs text-muted-foreground">
              {t("listings.sold_on", { date: formatDate(listing.sold_at, locale) })}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Status as typography: sage only for the forward-looking state. */
function statusLabel(
  listing: PublicListing,
  t: (key: string) => string,
): { label: string; accent: boolean } {
  if (listing.status === "coming_soon") return { label: t("listings.coming_soon"), accent: true };
  if (listing.status === "reserved") return { label: t("listings.reserved"), accent: false };
  if (listing.status === "sold") return { label: t("listings.sold"), accent: false };
  if (listing.status === "rented") return { label: t("listings.rented"), accent: false };
  return {
    label: t(listing.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale"),
    accent: false,
  };
}
