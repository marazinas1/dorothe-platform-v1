import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { LegalDocument } from "@/components/public/LegalDocument";
import type { Locale } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { legalText } from "@/lib/legal/documents";
import { legalHead } from "@/lib/legal/legal-head";
import { getRequestOrigin } from "@/lib/seo/origin.functions";

export const Route = createFileRoute("/$locale/datenschutz")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
    ]);
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    return legalHead({ ...loaderData, doc: "privacy" });
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <LegalDocument
        title={t("legal.privacy.title")}
        text={legalText(settings, "privacy", locale)}
      />
    </PublicChrome>
  );
}
