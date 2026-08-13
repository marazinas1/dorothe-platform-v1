import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import type { Locale } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { hasLegalDoc } from "@/lib/legal/documents";

type Props = {
  locale: Locale;
  className?: string;
};

/**
 * Impressum / Datenschutz / (AGB) links. Mandatory on every page, public and
 * admin, so they are never more than one click away (§5 DDG "ständig
 * verfügbar"). AGB only appear when the setting carries content.
 */
export function LegalLinks({ locale, className }: Props) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const showTerms = hasLegalDoc(settings, "terms");

  return (
    <div className={className}>
      <Link to="/$locale/impressum" params={{ locale }} className="hover:text-foreground">
        {t("footer.imprint")}
      </Link>
      <Link to="/$locale/datenschutz" params={{ locale }} className="hover:text-foreground">
        {t("footer.privacy")}
      </Link>
      {showTerms ? (
        <Link to="/$locale/agb" params={{ locale }} className="hover:text-foreground">
          {t("footer.terms")}
        </Link>
      ) : null}
    </div>
  );
}
