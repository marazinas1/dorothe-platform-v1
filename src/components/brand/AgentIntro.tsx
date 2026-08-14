import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import brokerPlaceholder from "@/assets/broker-placeholder.jpg";
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  settings: SiteSettings;
  /** Long-form personal story, already localized upstream. */
  bio: string;
  /** Extra paragraphs from translations, appended after the editable bio. */
  paragraphs?: string[];
  /** Eyebrow above the name; falls back to the translated kicker. */
  eyebrow?: string;
  name: string;
  /** Solo forks show the signature motif; agency forks pass false. */
  showSignature?: boolean;
};

/**
 * Agent intro: portrait beside eyebrow / name / prose / direct contact.
 * All client data arrives through site_settings, all copy through
 * translations or the editable about_body field.
 */
export function AgentIntro({
  locale,
  settings,
  bio,
  paragraphs = [],
  eyebrow,
  name,
  showSignature = true,
}: Props) {
  const { t } = useTranslation();
  const portrait = settings.primary_agent_photo_url ?? brokerPlaceholder;
  const role = eyebrow ?? t("pages.about.kicker");

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
      <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-12 lg:gap-16">
        <div className="md:col-span-5">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-media bg-muted">
            <img
              src={portrait}
              alt={name}
              width={1200}
              height={1500}
              loading="eager"
              className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out hover:scale-[1.02]"
            />
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="eyebrow text-muted-foreground">{role}</div>
          <h1 className="mt-5 font-heading text-4xl leading-[1.05] md:text-6xl">{name}</h1>
          {/* Signature intentionally not rendered here — it lives in the homepage hero. */}

          <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground">
            {bio ? <p>{bio}</p> : null}
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-2">
            {settings.contact_email ? (
              <div>
                <dt className="eyebrow text-muted-foreground">{t("pages.about.email_label")}</dt>
                <dd className="mt-2 text-base">
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="transition-opacity duration-300 hover:opacity-70"
                  >
                    {settings.contact_email}
                  </a>
                </dd>
              </div>
            ) : null}
            {settings.contact_phone ? (
              <div>
                <dt className="eyebrow text-muted-foreground">{t("pages.about.phone_label")}</dt>
                <dd className="mt-2 text-base tabular-figures">
                  <a
                    href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`}
                    className="transition-opacity duration-300 hover:opacity-70"
                  >
                    {settings.contact_phone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <Link
            to="/$locale/kontakt"
            params={{ locale }}
            className="mt-10 inline-flex items-center rounded-full bg-primary px-7 py-3 text-sm text-primary-foreground transition-opacity duration-300 hover:opacity-90"
          >
            {t("nav.contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
