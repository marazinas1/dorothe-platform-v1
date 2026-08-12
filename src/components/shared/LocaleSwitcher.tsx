import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { stripLocale } from "@/lib/seo/hreflang";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  currentLocale,
  enabledLocales,
  invert = false,
}: {
  currentLocale: string;
  enabledLocales: string[];
  /** Light text, for use over hero photography. */
  invert?: boolean;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const subpath = stripLocale(location.pathname, enabledLocales);

  return (
    <nav aria-label={t("locale.switch")} className="flex items-center gap-2 text-sm">
      {enabledLocales.map((loc) => {
        const isActive = loc === currentLocale;
        const target = `/${loc}${subpath === "/" ? "" : subpath}`;
        return (
          <Link
            key={loc}
            to={target}
            className={cn(
              "transition-colors duration-300",
              invert
                ? isActive
                  ? "font-semibold text-primary-foreground underline underline-offset-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                  : "text-primary-foreground/75 hover:text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                : isActive
                  ? "font-semibold underline underline-offset-4"
                  : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "true" : undefined}
          >
            {loc.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
