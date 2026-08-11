import { Link, useLocation, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LOCALES, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * EN/DE switch for the admin. Admin routes carry the locale, so switching is a
 * navigation to the same path under the other locale prefix.
 */
export function AdminLocaleToggle() {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const { t } = useTranslation();
  const location = useLocation();
  const rest = location.pathname.split("/").slice(2).join("/");

  return (
    <nav
      aria-label={t("locale.switch")}
      className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
    >
      {LOCALES.map((loc) => (
        <Link
          key={loc}
          to={`/$locale/${rest}` as string}
          params={{ locale: loc }}
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
