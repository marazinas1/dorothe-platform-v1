import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { specGroups } from "@/lib/listings/spec-groups";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  listing: PublicListing;
  locale: Locale;
  settings: SiteSettings;
};

/**
 * The full specification, grouped into size, building, costs and terms. Which
 * rows exist is decided in src/lib/listings/spec-groups.ts — this component
 * contains no deal-type or property-type test of its own.
 */
export function ListingSpecs({ listing, locale, settings }: Props) {
  const { t } = useTranslation();
  const groups = specGroups(listing, settings, locale, t);
  if (groups.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
        {t("listings.detail.sections.specs")}
      </h2>
      <div className="mt-10 grid gap-x-16 gap-y-12 sm:grid-cols-2">
        {groups.map((group) => (
          <section key={group.titleKey}>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t(group.titleKey)}
            </h3>
            <dl className="mt-4">
              {group.rows.map((row) => (
                <div
                  key={`${group.titleKey}-${row.label}`}
                  className="flex items-baseline justify-between gap-6 border-b border-border py-3"
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="tabular-figures text-right text-sm text-foreground">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
