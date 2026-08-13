import { Scale, ScanLine, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import { pickLocalized } from "@/lib/listings/format";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { SiteSettings } from "@/types/site-settings";

import { ClaimColumn } from "./ClaimColumn";
import { TrustSeals } from "./TrustSeals";

type Props = { locale: Locale; settings: SiteSettings };

/**
 * "Why her" — her own paragraph opens the block, three claims follow as
 * evidence. Three independent competences, so the graphic device is a trio of
 * thin line marks and a short rule, never numerals: a numbered list would imply
 * a sequence and a complete set. The certifying body appears in the evidence
 * line, never as a headline.
 */
export function WhyHer({ locale, settings }: Props) {
  const { t } = useTranslation();
  const intro = pickLocalized(settings.about_body, locale, settings.default_locale) || "";
  const seals = settings.seals ?? [];

  const claims = [
    { icon: Scale, key: "valuation" as const },
    { icon: ShieldCheck as typeof Scale, key: "inheritance" as const },
    { icon: ScanLine as typeof Scale, key: "personal" as const },
  ];

  return (
    <div className={SECTION_GAP.major}>
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <Reveal>
          <div className="eyebrow text-muted-foreground">{t("home.why_kicker")}</div>
          {intro ? (
            <p className="text-lead mt-8 max-w-[54ch] text-foreground">{intro}</p>
          ) : null}

          <div className="mt-16 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-10 lg:gap-16">
            <ClaimColumn
              icon={claims[0].icon}
              title={t("home.claim_valuation_title")}
              body={t("home.claim_valuation_body")}
              evidence={t("home.claim_valuation_evidence")}
            />
            <ClaimColumn
              icon={claims[1].icon}
              title={t("home.claim_inheritance_title")}
              body={t("home.claim_inheritance_body")}
              evidence={t("home.claim_inheritance_evidence")}
            />
            <ClaimColumn
              icon={claims[2].icon}
              title={t("home.claim_personal_title")}
              body={t("home.claim_personal_body")}
              evidence={t("home.claim_personal_evidence")}
            />
          </div>

          <p className="mt-16 text-sm leading-relaxed text-muted-foreground md:mt-20">
            {t("home.membership_line")}
          </p>
        </Reveal>
      </section>

      {seals.length > 0 ? (
        <TrustSeals
          locale={locale}
          items={seals}
          title={t("home.seals_title")}
          className={SECTION_GAP.tight}
        />
      ) : null}
    </div>
  );
}
