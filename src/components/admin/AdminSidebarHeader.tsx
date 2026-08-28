import { Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { SiteLogo } from "@/components/brand/SiteLogo";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import type { Locale } from "@/i18n/config";

/**
 * The brand mark above the admin menu, linking back to the dashboard. Same
 * source as the public site (site_settings + src/assets/brand), so a clone
 * changes nothing here.
 */
export function AdminSidebarHeader() {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarHeader className="border-b border-sidebar-border">
      <Link
        to="/$locale/admin"
        params={{ locale }}
        className="flex h-12 items-center px-2"
        aria-label={settings.site_name}
      >
        <SiteLogo
          settings={settings}
          size="sm"
          className={collapsed ? "h-6 md:h-6" : "h-8 md:h-8"}
        />
      </Link>
    </SidebarHeader>
  );
}
