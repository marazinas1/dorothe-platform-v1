import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { PublicListing } from "@/lib/listings/queries.functions";
import type { SiteSettings } from "@/types/site-settings";

import { Reveal } from "@/components/shared/Reveal";
import { LISTING_CARD_GRID } from "@/lib/homepage/card-grid";

import { ListingCard } from "./ListingCard";

type Props = {
  locale: Locale;
  items: PublicListing[];
  settings: SiteSettings;
};

export function FeaturedListings({ locale, items, settings }: Props) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <section className={`mx-auto ${SECTION_GAP.normal} max-w-[1400px] px-6 lg:px-10`}>
      <div className="mb-16 flex items-end justify-between gap-8">
        <h2 className="text-section max-w-3xl">
          {t("home.featured")}
        </h2>
        <Link
          to="/$locale/immobilien"
          params={{ locale }}
          className="hidden shrink-0 text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-opacity duration-300 hover:text-foreground md:block"
        >
          {t("home.view_all")} →
        </Link>
      </div>

      <div className={LISTING_CARD_GRID}>
        {items.map((l, i) => (
          <Reveal key={l.id} delay={i * 90}>
            <ListingCard listing={l} locale={locale} settings={settings} />
          </Reveal>
        ))}
      </div>


      <div className="mt-14 md:hidden">
        <Link
          to="/$locale/immobilien"
          params={{ locale }}
          className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          {t("home.view_all")} →
        </Link>
      </div>
    </section>
  );
}
