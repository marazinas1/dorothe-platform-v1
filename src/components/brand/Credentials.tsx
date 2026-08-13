import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import { buildCredentials } from "@/lib/homepage/credentials";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { SiteSettings } from "@/types/site-settings";

import { CredentialGroups } from "./CredentialGroups";
import { TrustSeals } from "./TrustSeals";

type Props = { locale: Locale; settings: SiteSettings };

/**
 * Credentials block — one block, one heading. The institutions and the
 * qualifications used to be two separate sections stating the same thing in two
 * formats; they are merged here so each certifying body is named once and
 * carries what it certifies. Supporting tier: the heading sits below the
 * valuation block, because this is evidence for the argument, not the argument.
 */
export function Credentials({ locale, settings }: Props) {
  const { t } = useTranslation();
  const credentials = buildCredentials(settings, locale);
  const seals = settings.seals ?? [];
  if (!credentials.hasContent && seals.length === 0) return null;

  return (
    <div className={SECTION_GAP.major}>
      {credentials.hasContent ? (
        <section className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <Reveal>
            <div className="max-w-2xl">
              <div className="eyebrow text-muted-foreground">
                {credentials.heading ?? t("home.credentials_title")}
              </div>
              <h2 className="text-section mt-6">{t("home.credentials_headline")}</h2>
              <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
                {t("home.credentials_note")}
              </p>
            </div>
            <CredentialGroups
              groups={credentials.groups}
              other={credentials.other}
              otherLabel={t("home.credentials_further")}
              className="mt-14"
            />
          </Reveal>
        </section>
      ) : null}
      {seals.length > 0 ? (
        <TrustSeals
          locale={locale}
          items={seals}
          title={t("home.seals_title")}
          className={credentials.hasContent ? SECTION_GAP.tight : undefined}
        />
      ) : null}
    </div>
  );
}
