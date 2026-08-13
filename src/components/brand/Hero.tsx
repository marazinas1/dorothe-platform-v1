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
 *  - text:  typographic opening. The headline runs to the widest measure on
 *           the page and the signature anchors the right edge on the same
 *           baseline as the actions, so the empty right side reads as chosen.
 *  - split: the one configured image beside the headline.
 * Copy comes from site_settings; the fallback line comes from the message
 * files so a fresh clone is never empty.
 */
export function Hero({ locale, settings, layout, image, headline, subline }: Props) {
  const { t } = useTranslation();
  const title = headline || t("home.hero_line");

  if (layout === "split" && image) {
    return (
      <section className="mx-auto flex max-w-[1400px] flex-col justify-center px-6 pb-14 pt-24 lg:min-h-[calc(100svh-7rem)] lg:px-10 lg:pb-8 lg:pt-24">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-14">
          <div className="md:col-span-7">
            <div className="eyebrow text-muted-foreground">{settings.site_name}</div>
            <h1 className="text-hero-split mt-4 max-w-[20ch] text-balance hyphens-auto lg:mt-5">
              {title}
            </h1>
            {subline ? (
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg lg:mt-5 lg:text-[1.0625rem]">
                {subline}
              </p>
            ) : null}
            <HeroActions locale={locale} className="mt-6 lg:mt-7" />
          </div>
          {/* Portrait after the text on a phone: the headline is read first.
              The portrait keeps its generous scale and is bounded by viewport
              height so the whole hero stays on one screen. */}
          <div className="md:col-span-5">
            <div className="mx-auto aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-sm lg:aspect-[4/5] lg:h-[clamp(320px,50svh,520px)] lg:w-auto lg:max-w-none">
              <img
                src={image}
                alt={settings.primary_agent_name ?? settings.site_name}
                className="h-full w-full object-cover object-top"
                fetchPriority="high"
              />
            </div>
            {/* Signature sits centred beneath the portrait it belongs to. */}
            <div className="mt-4 flex justify-center">
              <SignatureBlock settings={settings} align="center" />
            </div>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 pb-24 lg:px-10 lg:pt-44 lg:pb-32">
      <div className="eyebrow text-muted-foreground">{settings.site_name}</div>
      <h1 className="text-hero mt-8 max-w-[18ch] text-balance lg:max-w-[20ch]">{title}</h1>
      {subline ? (
        <p className="mt-10 max-w-[52ch] text-xl leading-[1.45] text-muted-foreground md:text-2xl lg:max-w-[64ch]">
          {subline}
        </p>
      ) : null}

      {/* Actions and signature share one baseline: the signature closes the
          right edge instead of drifting below the buttons. */}
      <div className="mt-16 flex flex-col gap-10 border-t border-border pt-10 md:flex-row md:items-end md:justify-between md:gap-16">
        <HeroActions locale={locale} className="mt-0" />
        <div className="md:text-right">
          <SignatureBlock settings={settings} align="right" />
        </div>
      </div>
    </section>
  );
}

function SignatureBlock({
  settings,
  align = "left",
}: {
  settings: SiteSettings;
  align?: "left" | "right" | "center";
}) {
  const alignment =
    align === "right" ? "md:items-end" : align === "center" ? "items-center text-center" : "items-start";
  return (
    <div className={`flex flex-col gap-1 ${alignment}`}>

      <Signature name={settings.primary_agent_name} size="md" />
      {settings.primary_agent_role ? (
        <span className="text-sm text-muted-foreground">{settings.primary_agent_role}</span>
      ) : null}
    </div>
  );
}

/**
 * The primary action is the valuation, because that is the decision a seller
 * is actually weighing. Browsing the catalogue stays available as a quieter
 * text link rather than a competing button.
 */
function HeroActions({ locale, className }: { locale: Locale; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-wrap items-center gap-x-8 gap-y-4 ${className ?? "mt-10"}`}
    >
      <Link
        to="/$locale/verkaufen"
        hash="form"
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
