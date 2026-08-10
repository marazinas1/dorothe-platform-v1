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

type Props = { locale: Locale; settings: SiteSettings };

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
 * Floating pill navigation: mark left, links centred, one sage CTA right.
 * Compacts slightly and gains a backdrop blur once the page scrolls.
 */
export function SiteNav({ locale, settings }: Props) {
  const { t } = useTranslation();
  const nav = useNavItems();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pointer-events-none sticky top-0 z-40 px-4 pt-4 md:px-6 md:pt-6">
      <div
        className={cn(
          "pointer-events-auto mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
          "rounded-full border border-border/70 bg-background/70 backdrop-blur-md",
          "transition-[padding,background-color] duration-500 ease-out lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
          scrolled ? "bg-background/85 px-4 py-2 md:px-5" : "px-5 py-3 md:px-7 md:py-4",
        )}
      >
        <Link
          to="/$locale"
          params={{ locale }}
          className="min-w-0 justify-self-start whitespace-nowrap transition-opacity duration-300 hover:opacity-70"
        >
          <SiteLogo settings={settings} size="sm" />
        </Link>

        <nav className="hidden items-center gap-7 justify-self-center lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              params={{ locale }}
              className="whitespace-nowrap text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 justify-self-end lg:gap-4">
          <div className="hidden lg:block">
            <LocaleSwitcher
              currentLocale={locale}
              enabledLocales={settings.enabled_locales}
            />
          </div>
          <Link
            to="/$locale/kontakt"
            params={{ locale }}
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground transition-opacity duration-300 hover:opacity-90 lg:inline-flex"
          >
            {t("nav.contact")}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("nav.menu")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 lg:hidden"
          >
            <span className="sr-only">{t("nav.menu")}</span>
            <span aria-hidden="true" className="flex flex-col gap-[5px]">
              <span className="block h-px w-4 bg-foreground" />
              <span className="block h-px w-4 bg-foreground" />
            </span>
          </button>
        </div>
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
