import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { QualificationsList } from "@/components/brand/QualificationsList";
import { SellerInquiryForm } from "@/components/brand/SellerInquiryForm";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/immobilienbewertung")({
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
    const title = `${translate(locale, "pages.valuation.title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/immobilienbewertung`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "pages.valuation.meta_description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: ValuationPage,
});

type Step = { title: string; body: string };

function ValuationPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  const steps = t("pages.valuation.steps", { returnObjects: true }) as Step[];
  const deliverables = t("pages.valuation.deliverables", { returnObjects: true }) as string[];
  // Valuation-relevant credentials only: the certifications that qualify her to
  // value a property, drawn from site_settings so a clone shows its own.
  const valuationCredentials = (settings.qualifications ?? []).filter((q) =>
    /bewert|DEKRA|Sprengnetter/i.test(q),
  );

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.valuation.kicker")}
            </div>
            <h1 className="mt-6 font-heading text-4xl leading-[1.05] md:text-6xl">
              {t("pages.valuation.headline")}
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-muted-foreground">
              {t("pages.valuation.intro")}
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80"
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-heading text-3xl leading-[1.1] md:text-4xl">
              {t("pages.valuation.steps_title")}
            </h2>
          </div>
          <div className="md:col-span-8">
            <ol className="divide-y divide-border border-y border-border">
              {steps.map((s, i) => (
                <li key={i} className="grid grid-cols-12 gap-6 py-10">
                  <div className="col-span-2 font-sans text-3xl tabular-figures text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="col-span-10">
                    <div className="font-heading text-2xl">{s.title}</div>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <h2 className="font-heading text-3xl leading-[1.1] md:text-4xl">
              {t("pages.valuation.deliverables_title")}
            </h2>
          </div>
          <div className="md:col-span-8">
            <ul className="space-y-6 border-t border-border pt-8 text-lg leading-relaxed">
              {deliverables.map((d, i) => (
                <li key={i} className="flex gap-4">
                  <span className="mt-3 h-px w-8 shrink-0 bg-foreground" aria-hidden />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <QualificationsList
        className="mt-32"
        title={t("pages.valuation.credentials_title")}
        note={t("pages.valuation.credentials_note")}
        items={valuationCredentials}
      />



      <section id="form" className="mx-auto mt-40 max-w-[1400px] px-6 pb-32 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.valuation.kicker")}
            </div>
            <h2 className="mt-6 font-heading text-3xl leading-[1.05] md:text-5xl">
              {t("pages.valuation.form_title")}
            </h2>
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              {t("pages.valuation.form_intro")}
            </p>
          </div>
          <div className="md:col-span-8">
            <SellerInquiryForm />
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
