import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import type { CredibilityStat, SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  stats: CredibilityStat[];
  settings: SiteSettings;
};

/**
 * A row of large numerals with small labels beneath. Values come from
 * site_settings.credibility_stats so each client can state their own numbers.
 * The section kicker/heading is drawn from site_settings.credibility_heading
 * (localized) so it never inherits another client's brand name.
 */
export function CredibilityBar({ locale, stats, settings }: Props) {
  const { t } = useTranslation();
  if (!stats || stats.length === 0) return null;

  const heading =
    settings.credibility_heading?.[locale] ??
    settings.credibility_heading?.[settings.default_locale] ??
    Object.values(settings.credibility_heading ?? {})[0] ??
    t("home.credibility_kicker", { agent: settings.site_name });

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <div className="mb-14 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {heading}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-14 border-t border-border pt-14 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="flex min-w-0 flex-col">
            <div className="flex min-h-14 items-end md:min-h-20">
            <div className="font-sans text-4xl leading-[1.05] text-foreground [overflow-wrap:anywhere] md:text-5xl">
              {s.value}
            </div>
            </div>
            <div className="mt-4 [overflow-wrap:anywhere] text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {s.label?.[locale] ?? s.label?.de ?? Object.values(s.label ?? {})[0] ?? ""}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
