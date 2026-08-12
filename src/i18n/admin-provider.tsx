import { I18nextProvider } from "react-i18next";
import { useMemo, type ReactNode } from "react";

import { getAdminI18n, type Locale } from "./config";

/**
 * Scopes the admin subtree to its own i18next instance, so the interface
 * language (a per-user preference) survives navigation and is never reverted by
 * the public site instance following the URL locale.
 */
export function AdminI18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const instance = useMemo(() => getAdminI18n(locale), [locale]);
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
