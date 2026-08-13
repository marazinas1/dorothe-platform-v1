import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { SiteSettings } from "@/types/site-settings";


type Props = {
  locale: Locale;
  settings: SiteSettings;
  /**
   * Portrait resolved by the homepage plan. It is null when the hero already
   * shows the same photograph, so the face never appears twice on one page.
   */
  portrait?: string | null;
};

/**
 * Short introduction paragraph. The body copy comes from
 * site_settings.about_body (localized) so every client tells their own
 * story — solo brokers speak in the first person, teams in the plural.
 * Falls back to the messages file only if a client has not filled it in.
 */
export function AboutBroker({ locale, settings, portrait }: Props) {
  const { t } = useTranslation();

  const body =
    settings.about_body?.[locale] ??
    settings.about_body?.[settings.default_locale] ??
    Object.values(settings.about_body ?? {})[0] ??
    t("home.about_body");

  if (!body) return null;

  return (
    <section className={`mx-auto ${SECTION_GAP.major} max-w-[1400px] px-6 lg:px-10`}>
      {/* The portrait carries this block; the copy reads at body size so the
          hero headline stays the largest type on the page. */}
      <Reveal className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-6">
          <div className="eyebrow text-muted-foreground">{t("home.about")}</div>
          {portrait ? (
            <img
              src={portrait}
              alt={settings.primary_agent_name ?? ""}
              loading="lazy"
              width={1200}
              height={929}
              className="mt-8 aspect-[4/5] w-full rounded-sm object-cover object-top"
            />
          ) : null}
        </div>
        <div className="md:col-span-5 md:col-start-8 md:pt-14">
          <p className="text-lead max-w-[48ch] whitespace-pre-line text-foreground">
            {body}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

