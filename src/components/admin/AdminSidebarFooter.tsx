import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ExternalLink, LogOut } from "lucide-react";

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSignOut } from "@/lib/auth/use-sign-out";
import type { Locale } from "@/i18n/config";

/** Public-site link and sign-out, kept together at the bottom of the sidebar. */
export function AdminSidebarFooter() {
  const { t } = useTranslation();
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const signOut = useSignOut();

  return (
    <SidebarFooter className="border-t border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip={t("admin.nav.viewSite")}>
            <Link
              to="/$locale"
              params={{ locale }}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{t("admin.nav.viewSite")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip={t("admin.topbar.signOut")} onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" />
            <span>{t("admin.topbar.signOut")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* Legal pages must be reachable in one click from every page. */}
      <LegalLinks
        locale={locale}
        className="flex flex-wrap gap-3 px-2 pb-1 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden"
      />
    </SidebarFooter>
  );
}
