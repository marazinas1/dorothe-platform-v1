import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingCard } from "@/components/brand/ListingCard";
import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  items: PublicListing[];
  settings: SiteSettings;
  /** Section heading, already resolved for solo vs. team wording. */
  heading: string;
};

/**
 * "My properties" block on the about page — the broker's active listings
 * rendered with the shared ListingCard, plus a link to the full index.
 */
export function AgentListings({ locale, items, settings, heading }: Props) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-32 max-w-[1400px] px-6 lg:px-10">
      <div className="mb-14 flex items-end justify-between gap-8 border-t border-border pt-12">
        <h2 className="max-w-3xl font-heading text-3xl md:text-5xl">{heading}</h2>
        <Link
          to="/$locale/immobilien"
          params={{ locale }}
          className="hidden shrink-0 eyebrow text-muted-foreground transition-colors duration-300 hover:text-foreground md:block"
        >
          {t("pages.about.all_properties")} →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((l, i) => (
          <Reveal key={l.id} delay={i * 90} className="h-full">
            <ListingCard listing={l} locale={locale} settings={settings} size="compact" />
          </Reveal>
        ))}
      </div>

      <div className="mt-12 md:hidden">
        <Link
          to="/$locale/immobilien"
          params={{ locale }}
          className="eyebrow text-muted-foreground"
        >
          {t("pages.about.all_properties")} →
        </Link>
      </div>
    </section>
  );
}
