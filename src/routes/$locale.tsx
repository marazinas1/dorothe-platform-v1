import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { I18nProvider } from "@/i18n/provider";
import { isLocale, type Locale } from "@/i18n/config";
import {
  getSiteSettings,
  siteSettingsQueryOptions,
} from "@/lib/config/site-settings.functions";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";

export const Route = createFileRoute("/$locale")({
  beforeLoad: async ({ params }) => {
    const settings = await getSiteSettings();
    const enabled = settings.enabled_locales;
    if (!enabled.includes(params.locale) || !isLocale(params.locale)) {
      throw redirect({
        to: "/$locale",
        params: { locale: settings.default_locale },
      });
    }
  },
  loader: async ({ context }) => {
    const [settings] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
    ]);
    return { settings };
  },
  component: LocaleLayout,
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive">
      Failed to load: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm">Not found</div>
  ),
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  usePageTracking();
  return (
    <I18nProvider locale={locale as Locale}>
      <Outlet />
    </I18nProvider>
  );
}
