import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { SiteLogo } from "@/components/brand/SiteLogo";
import { NavDrawer } from "@/components/brand/NavDrawer";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  locale: Locale;
  settings: SiteSettings;
  /** Page opens with a full-bleed hero: bar starts transparent over it. */
  overlay?: boolean;
};

/** Centre links; labels always come from translations, never hardcoded. */
export function useNavItems() {
  const { t } = useTranslation();
  const teamEnabled = useFeatureFlag("team");
  return [
    { to: "/$locale/immobilien" as const, label: t("nav.listings") },
    { to: "/$locale/verkauft" as const, label: t("nav.sold") },
    { to: "/$locale/immobilienbewertung" as const, label: t("nav.valuation") },
    {
      to: "/$locale/ueber-mich" as const,
      label: t(teamEnabled ? "nav.about_team" : "nav.about_solo"),
    },
  ];
}

/**
 * Full-width fixed navigation bar: tall, transparent over a hero photo, and
 * fading into a blurred surface once the page scrolls. Uppercase wide-tracked
 * links, one solid CTA on the right.
 */
export function SiteNav({ locale, settings, overlay = false }: Props) {
  const { t } = useTranslation();
  const nav = useNavItems();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Light text is only legible while the bar still sits on the hero photo.
  const onPhoto = overlay && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-out",
        onPhoto
          ? "bg-gradient-to-b from-background/85 via-background/45 to-transparent"
          : "border-b border-border/60 bg-background/90 backdrop-blur-md",
      )}
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <nav
          className={cn(
            "flex items-center justify-between transition-[height] duration-500 ease-out",
            scrolled ? "h-20" : "h-24 md:h-28",
          )}
        >
          <Link
            to="/$locale"
            params={{ locale }}
            className="min-w-0 shrink-0 transition-opacity duration-300 hover:opacity-80"
          >
            <SiteLogo settings={settings} size={scrolled ? "sm" : "md"} />
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                params={{ locale }}
                className={cn(
                  "whitespace-nowrap text-[13px] font-medium uppercase tracking-[0.15em] transition-colors duration-300",
                  "text-muted-foreground hover:text-foreground",
                )}
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}

            <LocaleSwitcher
              currentLocale={locale}
              enabledLocales={settings.enabled_locales}
            />

            <Link
              to="/$locale/kontakt"
              params={{ locale }}
              className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-[13px] font-medium uppercase tracking-[0.12em] text-primary-foreground transition-opacity duration-300 hover:opacity-90"
            >
              {t("nav.contact")}
            </Link>
          </div>

          <div className="flex items-center gap-4 lg:hidden">
            <LocaleSwitcher
              currentLocale={locale}
              enabledLocales={settings.enabled_locales}
            />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("nav.menu")}
              className="inline-flex h-10 w-10 items-center justify-center text-foreground"
            >
              <span className="sr-only">{t("nav.menu")}</span>
              <span aria-hidden="true" className="flex flex-col gap-[6px]">
                <span className="block h-px w-6 bg-current" />
                <span className="block h-px w-6 bg-current" />
                <span className="block h-px w-6 bg-current" />
              </span>
            </button>
          </div>
        </nav>
      </div>

      <NavDrawer
        open={open}
        onClose={() => setOpen(false)}
        locale={locale}
        settings={settings}
        items={nav}
      />
    </header>
  );
}
