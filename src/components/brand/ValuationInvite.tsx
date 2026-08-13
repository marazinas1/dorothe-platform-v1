import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import type { ValuationOffer } from "@/types/site-settings";

type Props = {
  locale: Locale;
  /** Localized offer from site_settings; the block hides when unset. */
  offer: ValuationOffer | null;
};

/**
 * A concrete offer, not an invitation to "get in touch": what the valuation
 * is, what the owner receives, and what it costs. All three come from
 * site_settings, so each client can describe their own service.
 */
export function ValuationInvite({ locale, offer }: Props) {
  const { t } = useTranslation();
  if (!offer) return null;

  return (
    <section className="mt-40 border-y border-border/60 bg-card">
      <Reveal className="mx-auto grid max-w-[1400px] gap-14 px-6 py-24 md:grid-cols-12 lg:px-10">
        <div className="md:col-span-5">
          <div className="eyebrow text-muted-foreground">{t("home.valuation_kicker")}</div>
          <h2 className="mt-6 max-w-[20ch] font-heading text-4xl leading-[1.1] md:text-5xl">
            {t("home.valuation_title")}
          </h2>
          {offer.body ? (
            <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground">
              {offer.body}
            </p>
          ) : null}
          <Link
            to="/$locale/immobilienbewertung"
            params={{ locale }}
            className="eyebrow mt-10 inline-flex h-12 items-center rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-300 hover:opacity-90"
          >
            {t("home.valuation_cta")}
          </Link>
        </div>

        <div className="md:col-span-6 md:col-start-7">
          <div className="eyebrow text-muted-foreground">
            {t("home.valuation_includes")}
          </div>
          <ul className="mt-8">
            {offer.deliverables.map((item) => (
              <li
                key={item}
                className="border-t border-border py-5 text-base leading-relaxed"
              >
                {item}
              </li>
            ))}
          </ul>
          {offer.price_note ? (
            <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
              {offer.price_note}
            </p>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
