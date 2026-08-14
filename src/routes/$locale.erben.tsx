import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { PageIntro } from "@/components/brand/PageIntro";
import { TextSection } from "@/components/brand/TextSection";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/erben")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
    ]);
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale } = loaderData;
    const title = `${translate(locale, "pages.inheritance.title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/erben`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "pages.inheritance.meta_description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: InheritancePage,
});

function InheritancePage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <PageIntro
        kicker={t("pages.inheritance.kicker")}
        headline={t("pages.inheritance.headline")}
        lead={t("pages.inheritance.intro")}
      />

      <TextSection
        title={t("pages.inheritance.appraisal_title")}
        body={t("pages.inheritance.appraisal_body")}
      />

      <TextSection
        title={t("pages.inheritance.community_title")}
        body={t("pages.inheritance.community_body")}
      />

      <TextSection
        title={t("pages.inheritance.credential_title")}
        body={t("pages.inheritance.credential_body")}
        quiet
      />

      <div className="pb-32">
        <TextSection
          title={t("pages.inheritance.contact_title")}
          body={t("pages.inheritance.contact_body")}
          quiet
        >
          <Link
            to="/$locale/kontakt"
            params={{ locale }}
            className="eyebrow text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            {t("pages.inheritance.contact_link")} →
          </Link>
        </TextSection>
      </div>
    </PublicChrome>
  );
}
