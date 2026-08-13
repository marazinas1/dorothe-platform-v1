import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { LISTING_CARD_GRID } from "@/lib/homepage/card-grid";
import type { PublicListing } from "@/lib/listings/queries.functions";
import type { SiteSettings } from "@/types/site-settings";

import { ListingCard } from "./ListingCard";

type Props = {
  items: PublicListing[];
  locale: Locale;
  settings: SiteSettings;
};

/**
 * Other properties that can actually be enquired about. The selection rules
 * (and why sold, rented and reserved are excluded) live in
 * src/lib/listings/related.ts; an empty selection hides the block entirely
 * rather than showing one card beside two gaps.
 */
export function RelatedListings({ items, locale, settings }: Props) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
        {t("listings.detail.sections.related")}
      </h2>
      <div className={`mt-10 ${LISTING_CARD_GRID}`}>
        {items.map((l) => (
          <ListingCard key={l.id} listing={l} locale={locale} settings={settings} />
        ))}
      </div>
    </div>
  );
}
