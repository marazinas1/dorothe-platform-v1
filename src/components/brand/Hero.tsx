import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import type { Locale } from "@/i18n/config";
import type { HeroLayout, SiteSettings } from "@/types/site-settings";

import { Signature } from "./Signature";

type Props = {
  locale: Locale;
  settings: SiteSettings;
  layout: HeroLayout;
  /** Resolved by the homepage plan — never a stock photograph. */
  image: string | null;
  headline: string;
  subline: string;
};

/**
 * Homepage hero. One image slot, two layouts:
 *  - text:  typographic opening, no photograph at all.
 *  - split: the one configured image beside the headline.
 * Copy comes from site_settings; the fallback line comes from the message
 * files so a fresh clone is never empty.
 */
export function Hero({ locale, settings, layout, image, headline, subline }: Props) {
  const { t } = useTranslation();
  const title = headline || t("home.hero_line");

  const body = (
    <>
      <div className="eyebrow text-muted-foreground">{settings.site_name}</div>
      <h1 className="text-hero mt-6 max-w-[24ch] text-balance">{title}</h1>
      {subline ? (
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {subline}
        </p>
      ) : null}
      <HeroActions locale={locale} />
      <div className="mt-12 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <Signature name={settings.primary_agent_name} size="md" />
        {settings.primary_agent_role ? (
          <span className="text-sm text-muted-foreground">{settings.primary_agent_role}</span>
        ) : null}
      </div>
    </>
  );

  if (layout === "split" && image) {
    return (
      <section className="mx-auto max-w-[1400px] px-6 pt-28 pb-24 lg:px-10 lg:pt-36 lg:pb-32">
        <div className="grid items-center gap-14 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">{body}</div>
          <div className="md:col-span-5">
            <img
              src={image}
              alt={settings.primary_agent_name ?? settings.site_name}
              className="aspect-[4/5] w-full rounded-sm object-cover object-top"
              fetchPriority="high"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 pb-24 lg:px-10 lg:pt-44 lg:pb-32">
      <div className="max-w-4xl">{body}</div>
    </section>
  );
}

/**
 * The primary action is the valuation, because that is the decision a seller
 * is actually weighing. Browsing the catalogue stays available as a quieter
 * text link rather than a competing button.
 */
function HeroActions({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
      <Link
        to="/$locale/immobilienbewertung"
        params={{ locale }}
        className="eyebrow inline-flex h-12 items-center rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-300 hover:opacity-90"
      >
        {t("home.hero_cta")}
      </Link>
      <Link
        to="/$locale/immobilien"
        params={{ locale }}
        className="eyebrow text-muted-foreground transition-colors duration-300 hover:text-foreground"
      >
        {t("home.hero_cta_secondary")} →
      </Link>
    </div>
  );
}
