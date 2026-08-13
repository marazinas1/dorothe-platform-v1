import { useTranslation } from "react-i18next";

import { Reveal } from "@/components/shared/Reveal";
import type { Locale } from "@/i18n/config";
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
    <section className="mx-auto mt-40 max-w-[1400px] px-6 lg:px-10">
      <Reveal className="grid grid-cols-1 gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("home.about")}
          </div>
          {portrait ? (
            <img
              src={portrait}
              alt={settings.primary_agent_name ?? ""}
              loading="lazy"
              width={1200}
              height={929}
              className="mt-8 aspect-[4/5] w-full max-w-xs rounded-sm object-cover object-top"
            />
          ) : null}
        </div>
        <div className="md:col-span-8">
          <p className="font-heading text-3xl leading-[1.15] text-foreground md:text-5xl whitespace-pre-line">
            {body}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

