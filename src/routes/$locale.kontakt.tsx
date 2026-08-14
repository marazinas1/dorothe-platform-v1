import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { submitBuyerInquiry } from "@/lib/inquiry/submit.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/kontakt")({
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
    const title = `${translate(locale, "pages.contact.title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/kontakt`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "pages.contact.meta_description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: ContactPage,
});

type Hours = { day: string; time: string };

function ContactPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const teamEnabled = useFeatureFlag("team");

  const hours = t("pages.contact.hours_default", { returnObjects: true }) as Hours[];

  const hasCoords =
    typeof settings.geo_lat === "number" && typeof settings.geo_lng === "number";
  const mapUrl = hasCoords
    ? buildOsmEmbed(settings.geo_lat as number, settings.geo_lng as number)
    : null;

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("pages.contact.kicker")}
          </div>
          <h1 className="mt-6 font-heading text-4xl leading-[1.05] md:text-6xl">
            {t(teamEnabled ? "pages.contact.headline_team" : "pages.contact.headline_solo")}
          </h1>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-14 border-y border-border py-14 md:grid-cols-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.contact.address_title")}
            </div>
            {settings.address_street ? (
              <p className="mt-6 text-base leading-relaxed text-foreground">
                {settings.address_street}
                <br />
                {settings.address_zip} {settings.address_city}
                <br />
                {settings.address_country ?? ""}
              </p>
            ) : null}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.contact.channels_title")}
            </div>
            <div className="mt-6 space-y-2 text-base text-foreground">
              {settings.contact_email ? (
                <div>
                  <a className="hover:opacity-70" href={`mailto:${settings.contact_email}`}>
                    {settings.contact_email}
                  </a>
                </div>
              ) : null}
              {settings.contact_phone ? (
                <div className="tabular-figures">
                  <a
                    className="hover:opacity-70"
                    href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`}
                  >
                    {settings.contact_phone}
                  </a>
                </div>
              ) : null}
              {settings.whatsapp ? (
                <div className="tabular-figures text-muted-foreground">
                  WhatsApp {settings.whatsapp}
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.contact.hours_title")}
            </div>
            <dl className="mt-6 space-y-2 text-base text-foreground">
              {hours.map((h, i) => (
                <div key={i} className="flex justify-between gap-6">
                  <dt className="text-muted-foreground">{h.day}</dt>
                  <dd className="tabular-figures">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-6 lg:px-10">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("pages.contact.map_title")}
        </div>
        <div className="mt-6 aspect-[16/9] w-full overflow-hidden border border-border bg-muted">
          {mapUrl ? (
            <iframe
              src={mapUrl}
              title={t("pages.contact.map_title")}
              className="h-full w-full"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
              {t("pages.contact.map_missing")}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1400px] px-6 pb-32 lg:px-10">
        <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("pages.contact.kicker")}
            </div>
            <h2 className="mt-6 font-heading text-3xl leading-[1.05] md:text-5xl">
              {t("pages.contact.form_title")}
            </h2>
            <p className="mt-6 max-w-sm text-sm text-muted-foreground">
              {t(teamEnabled ? "pages.contact.form_intro_team" : "pages.contact.form_intro_solo")}
            </p>
          </div>
          <div className="md:col-span-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}

function buildOsmEmbed(lat: number, lng: number): string {
  const dLat = 0.006;
  const dLng = 0.012;
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat]
    .map((n) => n.toFixed(6))
    .join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

const inputCls =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground outline-none transition-colors duration-300 focus:border-foreground";
const labelCls =
  "block text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

function ContactForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("submitting");
    try {
      await submitBuyerInquiry({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          message: String(fd.get("message") ?? ""),
          property_type: "",
          city: "",
          rooms_min: null,
          area_min: null,
          price_max: null,
        },
      });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="border-t border-border pt-10 text-sm text-foreground">
        {t("pages.contact.form_success")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="c-name">
            {t("pages.contact.form_name")}
          </label>
          <input id="c-name" name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="c-email">
            {t("pages.contact.form_email")}
          </label>
          <input id="c-email" name="email" type="email" required className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="c-phone">
            {t("pages.contact.form_phone")}
          </label>
          <input id="c-phone" name="phone" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="c-message">
            {t("pages.contact.form_message")}
          </label>
          <textarea
            id="c-message"
            name="message"
            required
            rows={4}
            className={`${inputCls} resize-none pt-3`}
          />
        </div>
      </div>

      {status === "error" ? (
        <div className="text-sm text-destructive">{t("pages.contact.form_error")}</div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-12 items-center justify-center bg-primary px-8 text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity duration-300 hover:opacity-85 disabled:opacity-60"
      >
        {status === "submitting"
          ? t("pages.contact.form_submitting")
          : t("pages.contact.form_submit")}
      </button>
    </form>
  );
}
