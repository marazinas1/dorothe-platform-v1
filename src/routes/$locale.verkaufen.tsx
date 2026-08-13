import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { PageIntro } from "@/components/brand/PageIntro";
import { NumberedSteps, type Step } from "@/components/brand/NumberedSteps";
import { TextSection } from "@/components/brand/TextSection";
import { SellerInquiryForm } from "@/components/brand/SellerInquiryForm";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/verkaufen")({
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
    const title = `${translate(locale, "pages.selling.title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/verkaufen`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "pages.selling.meta_description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: SellingPage,
});

function SellingPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const steps = t("pages.selling.steps", { returnObjects: true }) as Step[];
  const services = t("pages.selling.services", { returnObjects: true }) as string[];

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <PageIntro
        kicker={t("pages.selling.kicker")}
        headline={t("pages.selling.headline")}
        lead={t("pages.selling.intro")}
      />

      <NumberedSteps title={t("pages.selling.steps_title")} steps={steps} />

      <TextSection
        title={t("pages.selling.services_title")}
        body={t("pages.selling.services_body")}
        items={services}
      />

      <TextSection
        title={t("pages.selling.costs_title")}
        body={t("pages.selling.costs_body")}
      />

      <section
        id="form"
        className="mx-auto mt-40 max-w-[1400px] px-6 lg:mt-56 lg:px-10"
      >
        <div className="grid grid-cols-1 gap-14 border-t border-border pt-16 md:grid-cols-12 lg:pt-24">
          <div className="md:col-span-4">
            <div className="eyebrow text-muted-foreground">{t("pages.selling.kicker")}</div>
            <h2 className="text-section-lg mt-8 max-w-[18ch] text-balance">
              {t("pages.selling.form_title")}
            </h2>
            <p className="text-lead mt-8 max-w-[42ch] text-muted-foreground">
              {t("pages.selling.form_intro")}
            </p>
          </div>
          <div className="md:col-span-8">
            <SellerInquiryForm />
          </div>
        </div>
      </section>

      <div className="pb-32">
        <TextSection
          title={t("pages.selling.proof_title")}
          body={t("pages.selling.proof_body")}
          quiet
        >
          <Link
            to="/$locale/verkauft"
            params={{ locale }}
            className="eyebrow text-muted-foreground transition-colors duration-300 hover:text-foreground"
          >
            {t("pages.selling.proof_link")} →
          </Link>
        </TextSection>
      </div>
    </PublicChrome>
  );
}
