import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * EN/DE switch for the admin. Admin routes carry the locale, so switching is a
 * navigation to the same path under the other locale prefix.
 */
export function AdminLocaleToggle() {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const { t } = useTranslation();
  const location = useLocation();
  const rest = location.pathname.split("/").slice(2).filter(Boolean);

  return (
    <nav
      aria-label={t("admin.topbar.interfaceLanguage")}
      className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
    >
      {SUPPORTED_LOCALES.map((loc: Locale) => (
        <Link
          key={loc}
          // Same path under the other locale prefix; the route params are
          // already in the pathname, so a concrete path is what we need here.
          to={["", loc, ...rest].join("/") as never}
          replace
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors",
            loc === locale
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {loc}
        </Link>
      ))}
    </nav>
  );
}
