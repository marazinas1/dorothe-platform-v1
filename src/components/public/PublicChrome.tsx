import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

import { SiteNav } from "@/components/brand/SiteNav";
import { LegalLinks } from "@/components/public/LegalLinks";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { HomeLink } from "@/components/shared/HomeLink";
import type { Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  settings: SiteSettings;
  /** Page opens with a full-bleed hero the header can sit on top of. */
  heroOverlay?: boolean;
  children: ReactNode;
};

/** Site header + footer wrapper for public pages. */
export function PublicChrome({ locale, settings, heroOverlay = false, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteNav locale={locale} settings={settings} overlay={heroOverlay} />
      {/* The header is fixed, so pages without a hero need the height back. */}
      <main className={heroOverlay ? "flex-1" : "flex-1 pt-24 md:pt-28"}>{children}</main>
      <Footer locale={locale} settings={settings} />
    </div>
  );
}

function Footer({ locale, settings }: { locale: Locale; settings: SiteSettings }) {
  const { t } = useTranslation();
  return (
    <footer className="mt-24 border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-14 md:grid-cols-3 lg:px-10">
        <div>
          <HomeLink locale={locale} label={settings.site_name}>
            <SiteLogo settings={settings} />
          </HomeLink>
          {settings.address_street ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {settings.address_street}
              <br />
              {settings.address_zip} {settings.address_city}
              <br />
              {settings.address_country ?? ""}
            </p>
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground">
          {settings.contact_email ? (
            <div>
              <a className="hover:text-foreground" href={`mailto:${settings.contact_email}`}>
                {settings.contact_email}
              </a>
            </div>
          ) : null}
          {settings.contact_phone ? <div className="tabular-figures">{settings.contact_phone}</div> : null}
        </div>
        <div className="text-sm text-muted-foreground md:text-right">
          <div>
            © {new Date().getFullYear()} {settings.legal_name ?? settings.site_name}.{" "}
            {t("footer.rights")}.
          </div>
          <LegalLinks
            locale={locale}
            className="mt-2 flex flex-wrap gap-4 md:justify-end"
          />
          <div className="mt-2 flex gap-4 md:justify-end">
            <Link to="/$locale/admin" params={{ locale }} className="hover:text-foreground">
              {t("nav.admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
