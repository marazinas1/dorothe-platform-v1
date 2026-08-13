import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";

type Props = { locale: Locale };

/**
 * Two paths through the site: selling and buying. Selling comes first and
 * carries the visual weight, because winning a mandate is the business — a
 * buyer will find the catalogue whether or not it is promoted here.
 */
export function TwoPaths({ locale }: Props) {
  const { t } = useTranslation();

  return (
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <Reveal className="grid gap-6 md:grid-cols-12 md:gap-8">
        <Link
          to="/$locale/verkaufen"
          params={{ locale }}
          className="group flex flex-col justify-between rounded-sm bg-primary p-10 text-primary-foreground transition-opacity duration-300 hover:opacity-95 md:col-span-7 md:p-14"
        >
          <div>
            <div className="eyebrow opacity-80">{t("home.path_sell_kicker")}</div>
            <h2 className="mt-6 max-w-[22ch] font-heading text-4xl leading-[1.1] md:text-5xl">
              {t("home.path_sell_title")}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed opacity-90">
              {t("home.path_sell_body")}
            </p>
          </div>
          <span className="eyebrow mt-14 inline-flex items-center gap-2">
            {t("home.path_sell_cta")}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </Link>

        <Link
          to="/$locale/immobilien"
          params={{ locale }}
          className="group flex flex-col justify-between rounded-sm border border-border bg-card p-10 transition-colors duration-300 hover:border-foreground/30 md:col-span-5 md:p-12"
        >
          <div>
            <div className="eyebrow text-muted-foreground">{t("home.path_buy_kicker")}</div>
            <h2 className="mt-6 max-w-[18ch] font-heading text-3xl leading-[1.1] md:text-4xl">
              {t("home.path_buy_title")}
            </h2>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
              {t("home.path_buy_body")}
            </p>
          </div>
          <span className="eyebrow mt-14 inline-flex items-center gap-2 text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
            {t("home.path_buy_cta")}
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </Reveal>
    </section>
  );
}
