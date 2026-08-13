import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

import { CredibilityBar } from "./CredibilityBar";
import { QualificationsList } from "./QualificationsList";
import { TrustSeals } from "./TrustSeals";

type Props = { locale: Locale; settings: SiteSettings };

/**
 * Credentials block. Qualifications are the reason a seller picks a small
 * office over a franchise, so they get a block of their own rather than a
 * line in the footer: the named certifications, the headline figures and the
 * seals of the issuing bodies.
 */
export function Credentials({ locale, settings }: Props) {
  const { t } = useTranslation();
  const stats = settings.credibility_stats ?? [];
  const qualifications = settings.qualifications ?? [];
  const seals = settings.seals ?? [];
  if (stats.length === 0 && qualifications.length === 0 && seals.length === 0) return null;

  return (
    <div className="mt-40">
      {stats.length > 0 ? (
        <CredibilityBar locale={locale} stats={stats} settings={settings} />
      ) : null}
      {qualifications.length > 0 ? (
        <Reveal className={stats.length > 0 ? "mt-24" : undefined}>
          <QualificationsList
            items={qualifications}
            title={t("home.credentials_title")}
            note={t("home.credentials_note")}
          />
        </Reveal>
      ) : null}
      {seals.length > 0 ? (
        <TrustSeals
          locale={locale}
          items={seals}
          title={t("home.seals_title")}
          className="mt-20"
        />
      ) : null}
    </div>
  );
}
