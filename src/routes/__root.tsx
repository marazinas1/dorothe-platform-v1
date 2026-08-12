import { QueryClient, QueryClientProvider, useSuspenseQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";
import { currentUserQueryOptions } from "@/lib/auth/current-user.functions";
import { ThemeStyleTag } from "@/components/shared/ThemeStyleTag";
import { Toaster } from "@/components/ui/sonner";

import { extractLocale } from "@/lib/seo/hreflang";
import { translate, FALLBACK_LOCALE, isLocale, type Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

/** Resolve the active locale from URL, falling back to site default. */
function useActiveLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // site_settings is preloaded in the root loader, so this cache read is safe.
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);
  const fromUrl = extractLocale(pathname, data.enabled_locales);
  if (fromUrl && isLocale(fromUrl)) return fromUrl;
  return isLocale(data.default_locale) ? (data.default_locale as Locale) : FALLBACK_LOCALE;
}

function NotFoundComponent() {
  const locale = useActiveLocale();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {translate(locale, "errors.notFound")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {translate(locale, "errors.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const locale = useActiveLocale();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {translate(locale, "errors.somethingWentWrong")}
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {translate(locale, "errors.tryAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Sitewide defaults ONLY — no page-specific description, no canonical, no og:image.
  // Title/site name come from site_settings so a clone never ships another
  // client's name (or a template placeholder) as its fallback title.
  head: ({
    loaderData,
  }: {
    loaderData?: { siteName: string; faviconUrl: string | null };
  }) => {
    const siteName = loaderData?.siteName ?? "Real estate";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { title: siteName },
        { property: "og:site_name", content: siteName },
        { property: "og:title", content: siteName },
        { name: "twitter:title", content: siteName },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        {
          rel: "icon",
          href: loaderData?.faviconUrl ?? "/favicon.png",
          ...(loaderData?.faviconUrl ? {} : { type: "image/png" }),
        },
      ],
    };
  },
  // Preload config once per request; children re-read via ensureQueryData (dedup).
  loader: async ({ context }) => {
    const [settings] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
      context.queryClient.ensureQueryData(currentUserQueryOptions),
    ]);
    return { siteName: settings.site_name, faviconUrl: settings.favicon_url };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { queryClient } = Route.useRouteContext();
  // Preloaded by the root loader; read from cache to avoid needing a
  // QueryClientProvider around the shell.
  const settings = queryClient.getQueryData(
    siteSettingsQueryOptions.queryKey,
  ) as SiteSettings | undefined;
  const urlLocale = settings
    ? extractLocale(pathname, settings.enabled_locales)
    : null;
  const lang = urlLocale ?? settings?.default_locale ?? FALLBACK_LOCALE;

  return (
    <html lang={lang}>
      <head>
        <HeadContent />
        {settings ? <ThemeStyleTag settings={settings} /> : null}
        {/* Flags JS support so CSS-only scroll-reveal never hides SSR content. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

