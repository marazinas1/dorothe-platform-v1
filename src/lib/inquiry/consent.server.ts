import { getSiteSettings } from "@/lib/config/site-settings.functions";
import { privacyVersion } from "@/lib/legal/privacy-version.server";

/**
 * Consent evidence written on every inquiry row: when the box was ticked and
 * which privacy text the visitor was shown. A boolean alone demonstrates
 * nothing (GDPR Art. 5(2)).
 */
export async function consentColumns(locale: string | undefined) {
  const settings = await getSiteSettings();
  const loc = locale || settings.default_locale;
  return {
    locale: loc,
    consent_at: new Date().toISOString(),
    consent_privacy_version: await privacyVersion(settings, loc),
  };
}
