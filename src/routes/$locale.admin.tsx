import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { verifyAdminAccess } from "@/lib/auth/admin-gate.functions";
import { permissionMatrixQueryOptions } from "@/lib/auth/permission-matrix.functions";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { resolveMessageLocale } from "@/i18n/config";
import { AdminI18nProvider } from "@/i18n/admin-provider";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/$locale/admin")({
  // Client-only gate: the Supabase session lives in localStorage, which the
  // server cannot read, so gating during SSR would loop back to login on every
  // hard refresh. The gate confirms a real session, then verifies the profile
  // server-side (bearer token validated by requireSupabaseAuth).
  ssr: false,
  beforeLoad: async ({ params, location }) => {
    const toLogin = (reason?: string) =>
      redirect({
        to: "/$locale/auth/login",
        params: { locale: params.locale },
        search: { redirect: location.href, ...(reason ? { error: reason } : {}) },
      });

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw toLogin();

    let profile: Awaited<ReturnType<typeof verifyAdminAccess>> = null;
    try {
      profile = await verifyAdminAccess();
    } catch {
      throw toLogin("gate");
    }
    if (!profile) throw toLogin("noaccess");

    return { adminProfile: profile };
  },
  loader: async ({ context }) => {
    // Preload the authoritative role matrix so the admin shell can resolve
    // permissions synchronously via useSuspenseQuery.
    await context.queryClient.ensureQueryData(permissionMatrixQueryOptions);
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { adminProfile } = Route.useRouteContext();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  // Interface language: per-user preference first, then the site's default.
  // A stored value we ship no message file for is ignored, not erased.
  const interfaceLocale = resolveMessageLocale(
    adminProfile.admin_locale,
    settings.default_locale,
  );

  return (
    <AdminI18nProvider locale={interfaceLocale}>
      <AdminShell profile={adminProfile} interfaceLocale={interfaceLocale}>
        <Outlet />
      </AdminShell>
    </AdminI18nProvider>
  );
}
