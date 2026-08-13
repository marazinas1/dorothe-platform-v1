import type { Locale } from "@/i18n/config";
import { pickLocalized } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

/**
 * The legal documents a broker site can publish.
 *
 * Impressum (§5 DDG) and the privacy notice (GDPR Art. 13) are mandatory for
 * every clone, AGB are optional. Paths stay German in every locale, like
 * /immobilien and /ueber-mich.
 */
export type LegalDocKey = "impressum" | "privacy" | "terms";

type LegalDoc = {
  /** site_settings column holding the localized text. */
  field: "legal_impressum" | "legal_privacy" | "legal_terms";
  /** Path segment, identical in all locales. */
  segment: "impressum" | "datenschutz" | "agb";
  /** Translation key for the page heading. */
  titleKey: string;
  /** Optional documents are hidden entirely when empty. */
  optional: boolean;
};

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
  impressum: {
    field: "legal_impressum",
    segment: "impressum",
    titleKey: "legal.impressum.title",
    optional: false,
  },
  privacy: {
    field: "legal_privacy",
    segment: "datenschutz",
    titleKey: "legal.privacy.title",
    optional: false,
  },
  terms: {
    field: "legal_terms",
    segment: "agb",
    titleKey: "legal.terms.title",
    optional: true,
  },
};

/** Stored text for the current locale, falling back to the default locale. */
export function legalText(
  settings: SiteSettings,
  key: LegalDocKey,
  locale: string,
): string {
  const value = settings[LEGAL_DOCS[key].field];
  return pickLocalized(value, locale, settings.default_locale).trim();
}

/** True when any enabled locale carries content for this document. */
export function hasLegalDoc(settings: SiteSettings, key: LegalDocKey): boolean {
  const value = settings[LEGAL_DOCS[key].field] ?? {};
  return Object.values(value).some((v) => typeof v === "string" && v.trim().length > 0);
}

/** Public path of a legal document for a given locale. */
export function legalPath(key: LegalDocKey, locale: Locale | string): string {
  return `/${locale}/${LEGAL_DOCS[key].segment}`;
}

/**
 * Split the stored plain text into paragraphs. The text is trusted admin
 * input, but it is rendered as text nodes — never as HTML — so it can never
 * execute anything.
 */
export function legalParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
