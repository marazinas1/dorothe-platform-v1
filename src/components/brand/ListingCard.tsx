import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingFactPills } from "@/components/brand/ListingFactPills";
import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import { formatDate, formatPrice, pickLocalized } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
  size?: "large" | "compact";
};

/**
 * Brand-owned listing card: photograph, fact pills, headline, two lines of
 * description, price. Hairline border, uniform media radius, no shadow.
 */
export function ListingCard({ listing, locale, settings, size = "large" }: Props) {
  const { t } = useTranslation();
  const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
  const image =
    pickImageUrl(primary?.variants, size === "large" ? "detail" : "card") ??
    pickImageUrl(primary?.variants, "card");
  // Second photograph drives the exterior → interior cross-fade on hover.
  const secondary = listing.images.find((i) => i !== primary);
  const secondaryImage = pickImageUrl(secondary?.variants, "card");
  const title = pickLocalized(listing.title, locale) || listing.slug;
  const description = pickLocalized(listing.description, locale);
  const price = formatPrice(listing.price, settings.currency, locale, {
    onRequest: listing.price_on_request,
    period: listing.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const status = statusLabel(listing, t);

  return (
    <Link
      to="/$locale/immobilien/$slug"
      params={{ locale, slug: listing.slug }}
      className="group block rounded-media border border-border/70 bg-card p-3 md:p-4"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-media bg-muted">
        {image ? (
          <img
            src={image}
            alt={pickLocalized(primary?.alt_text, locale) || ""}
            loading="lazy"
            width={1200}
            height={800}
            className={
              secondaryImage
                ? "absolute inset-0 h-full w-full object-cover transition-[transform,opacity] duration-[1000ms] ease-out group-hover:scale-[1.03] group-hover:opacity-0"
                : "absolute inset-0 h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.05]"
            }
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        {secondaryImage ? (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1200}
            height={800}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[1000ms] ease-out group-hover:opacity-100"
          />
        ) : null}
      </div>

      <div className="px-2 pt-5 pb-2 md:px-3">
        <div className="flex items-baseline justify-between gap-4">
          <span
            className={
              status.accent ? "eyebrow text-primary" : "eyebrow text-muted-foreground"
            }
          >
            {status.label}
          </span>
          <span className="eyebrow text-muted-foreground">{listing.address_city}</span>
        </div>

        <div className="mt-4">
          <ListingFactPills listing={listing} locale={locale} settings={settings} />
        </div>

        <h3 className="mt-4 font-heading text-2xl leading-tight text-foreground md:text-[1.75rem]">
          {title}
        </h3>

        {description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        <div className="mt-5 flex items-baseline justify-between gap-6 border-t border-border/70 pt-4 text-sm">
          <span className="font-body tabular-figures text-foreground">{price}</span>
          {listing.status === "sold" && listing.sold_at ? (
            <span className="text-xs text-muted-foreground">
              {t("listings.sold_on").replace("{{date}}", formatDate(listing.sold_at, locale))}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
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
