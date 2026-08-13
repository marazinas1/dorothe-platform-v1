import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { copyVars } from "@/lib/config/site-copy";
import { buildHead } from "@/lib/seo/build-head";
import type { SiteSettings } from "@/types/site-settings";

import { LEGAL_DOCS, legalPath, type LegalDocKey } from "./documents";

/** Head metadata for a legal page — identical shape for all three documents. */
export function legalHead(args: {
  settings: SiteSettings;
  origin: string;
  locale: Locale;
  doc: LegalDocKey;
}) {
  const { settings, origin, locale, doc } = args;
  const title = `${translate(locale, LEGAL_DOCS[doc].titleKey)} — ${settings.site_name}`;
  return buildHead({
    origin,
    path: legalPath(doc, locale),
    locale,
    enabledLocales: settings.enabled_locales,
    defaultLocale: settings.default_locale,
    title,
    description: translate(
      locale,
      `legal.${doc}.meta_description`,
      copyVars(settings, locale),
    ),
    siteName: settings.site_name,
    ogDefaultImage: settings.og_default_image,
  });
}
