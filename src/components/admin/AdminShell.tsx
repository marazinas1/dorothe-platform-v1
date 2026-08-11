import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/config";
import type { VerifiedAdminProfile } from "@/lib/auth/admin-gate.server";

import { AdminSidebar } from "./AdminSidebar";
import { AdminLocaleToggle } from "./AdminLocaleToggle";

export function AdminShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: VerifiedAdminProfile;
}) {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const { t } = useTranslation();

  useEffect(() => {
    if (locale) getI18n(locale);
  }, [locale]);

  const displayName = profile.full_name || profile.email || t("admin.topbar.unknownUser");
  const roleLabel = t(`admin.role.${profile.role}`);

  return (
    <SidebarProvider>
      {/* One design system: same tokens as the public site, denser scale only. */}
      <div className="admin-density flex min-h-screen w-full bg-background text-foreground">

        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                aria-label={t("admin.topbar.toggleSidebar")}
                className="text-foreground"
              />
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <AdminLocaleToggle />
              <div className="hidden min-w-0 text-right sm:block">
                <div className="truncate text-sm font-medium">{displayName}</div>
                <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
              </div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
