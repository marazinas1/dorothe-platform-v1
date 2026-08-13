import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { SEARCH_DEFAULTS } from "@/lib/listings/search-schema";

type Props = {
  locale: Locale;
  /** Areas from site_settings, or listing cities while that setting is empty. */
  cities: string[];
  /**
   * Configured service areas are a coverage statement and may include towns
   * with nothing for sale today, so they must not link into a filtered list
   * that would come back empty.
   */
  linkable?: boolean;
  /**
   * `footer` renders the same links at footer scale on every page, so an owner
   * who arrived from a local search finds them from a listing too.
   */
  tone?: "section" | "footer";
};

/** Broker service area — town names as large-typography anchor links.
 *  Cities are derived from the live listings so a swapped dataset never
 *  leaves stale place names on the homepage. Heading switches between
 *  solo and team wording based on the `team` feature flag. */
export function AreaLinks({ locale, cities, linkable = true, tone = "section" }: Props) {
  const { t } = useTranslation();
  const teamEnabled = useFeatureFlag("team");
  if (cities.length === 0) return null;
  const footer = tone === "footer";

  return (
    <section
      className={
        footer
          ? "mx-auto max-w-[1400px] px-6 lg:px-10"
          : `mx-auto ${SECTION_GAP.normal} max-w-[1400px] px-6 lg:px-10`
      }
    >
      <h2 className={footer ? "text-sm text-muted-foreground" : "text-section-sm max-w-3xl"}>
        {t(teamEnabled ? "home.areas" : "home.areas_solo")}
      </h2>

      <div
        className={
          footer
            ? "mt-4 flex flex-wrap gap-x-6 gap-y-2"
            : "mt-10 grid grid-cols-2 gap-x-10 gap-y-2 md:grid-cols-4"
        }
      >
        {cities.map((city) =>
          linkable ? (
          <Link
            key={city}
            to="/$locale/immobilien"
            params={{ locale }}
            search={{ ...SEARCH_DEFAULTS, city }}
            className={
              footer
                ? "text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
                : "group border-t border-border py-8 transition-opacity duration-300 hover:opacity-70"
            }
          >
            <div className={footer ? "" : "text-section-sm"}>{city}</div>
          </Link>
          ) : (
            <div
              key={city}
              className={footer ? "text-sm text-muted-foreground" : "border-t border-border py-8"}
            >
              <div className={footer ? "" : "text-section-sm"}>{city}</div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
