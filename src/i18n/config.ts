import i18n, { createInstance, type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import de from "@/messages/de.json";
import en from "@/messages/en.json";

export const SUPPORTED_LOCALES = ["de", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/**
 * The locales we actually ship message files for. The admin interface can only
 * be operated in one of these; a client publishing in other languages still
 * operates the panel in one of the shipped ones.
 */
export const MESSAGE_LOCALES = SUPPORTED_LOCALES;

/**
 * Last-resort fallback, used ONLY when site_settings cannot be read at all.
 * Everywhere a real setting is available, site_settings.default_locale decides.
 * It matches the schema default of site_settings.default_locale.
 */
export const FALLBACK_LOCALE: Locale = "de";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Resolve a stored/unknown value against the shipped message files. */
export function resolveMessageLocale(
  ...candidates: (string | null | undefined)[]
): Locale {
  for (const candidate of candidates) {
    if (isLocale(candidate)) return candidate;
  }
  return FALLBACK_LOCALE;
}

const resources = {
  de: { translation: de },
  en: { translation: en },
};

let initialized = false;

/** The public site instance. Its language follows the URL locale. */
export function getI18n(locale: Locale) {
  if (!initialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: FALLBACK_LOCALE,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    initialized = true;
  } else if (i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }
  return i18n;
}

let adminInstance: I18nInstance | null = null;

/**
 * A separate instance for the admin panel. The interface language is a per-user
 * preference, unrelated to the URL locale, so it must not be reverted when the
 * public instance changes language on navigation.
 */
export function getAdminI18n(locale: Locale) {
  if (!adminInstance) {
    adminInstance = createInstance();
    void adminInstance.use(initReactI18next).init({
      resources,
      lng: locale,
      fallbackLng: FALLBACK_LOCALE,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
  } else if (adminInstance.language !== locale) {
    void adminInstance.changeLanguage(locale);
  }
  return adminInstance;
}

/**
 * Pure translation lookup usable during SSR head() without React context.
 * Supports {{var}} interpolation so client-specific words (region, agent name)
 * can come from site_settings instead of the translation files.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number | null | undefined>,
): string {
  const dict = locale === "de" ? de : en;
  const parts = key.split(".");
  let node: unknown = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  if (typeof node !== "string") return key;
  if (!vars) return node;
  return node.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const value = vars[name];
    return value == null ? match : String(value);
  });
}
