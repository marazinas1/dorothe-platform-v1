import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { ValuationOffer } from "@/types/site-settings";

type Props = {
  locale: Locale;
  /** Localized offer from site_settings; the block hides when unset. */
  offer: ValuationOffer | null;
};

/**
 * The block that earns the mandate, and after the hero the most resolved thing
 * on the page. The emphasis comes from space, measure and type — the widest
 * break above it, the largest heading below the hero, a short measure, and the
 * only large action outside the hero. Deliberately not a filled panel: the page
 * is a restrained typographic one and the two-paths block already carries the
 * single large filled area.
 */
export function ValuationInvite({ locale, offer }: Props) {
  const { t } = useTranslation();
  if (!offer) return null;

  return (
    <section className={`${SECTION_GAP.major} border-t border-border`}>
      <Reveal className="mx-auto grid max-w-[1400px] gap-14 px-6 pt-16 pb-8 md:grid-cols-12 lg:gap-20 lg:px-10 lg:pt-24">
        <div className="md:col-span-6">
          <div className="eyebrow text-muted-foreground">{t("home.valuation_kicker")}</div>
          <h2 className="text-section-lg mt-8 max-w-[18ch] text-balance">
            {t("home.valuation_title")}
          </h2>
          {offer.body ? (
            <p className="text-lead mt-8 max-w-[46ch] text-muted-foreground">{offer.body}</p>
          ) : null}
          <Link
            to="/$locale/immobilienbewertung"
            params={{ locale }}
            className="eyebrow mt-12 inline-flex h-14 items-center rounded-sm bg-primary px-9 text-primary-foreground transition-opacity duration-300 hover:opacity-90"
          >
            {t("home.valuation_cta")}
          </Link>
        </div>

        <div className="md:col-span-5 md:col-start-8 md:pt-3">
          <div className="eyebrow text-muted-foreground">
            {t("home.valuation_includes")}
          </div>
          <ul className="mt-8">
            {offer.deliverables.map((item) => (
              <li
                key={item}
                className="border-t border-border py-5 text-base leading-relaxed md:text-lg"
              >
                {item}
              </li>
            ))}
          </ul>
          {offer.price_note ? (
            <p className="mt-8 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
              {offer.price_note}
            </p>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
