import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { LegalDocument } from "@/components/public/LegalDocument";
import type { Locale } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { LEGAL_DOCS, hasLegalDoc, legalText } from "@/lib/legal/documents";
import { legalHead } from "@/lib/legal/legal-head";
import { getRequestOrigin } from "@/lib/seo/origin.functions";

export const Route = createFileRoute("/$locale/agb")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
    ]);
    // AGB are optional for a broker: without content the page does not exist.
    if (!hasLegalDoc(settings, "terms")) throw notFound();
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "…" }, { name: "robots", content: "noindex" }] };
    }
    return legalHead({ ...loaderData, doc: "terms" });
  },
  component: TermsPage,
});

function TermsPage() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <LegalDocument
        title={t(LEGAL_DOCS.terms.titleKey)}
        text={legalText(settings, "terms", locale)}
      />
    </PublicChrome>
  );
}
