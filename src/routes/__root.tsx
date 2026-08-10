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
import { translate, DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import type { SiteSettings } from "@/types/site-settings";

/** Resolve the active locale from URL, falling back to site default. */
function useActiveLocale(): Locale {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // site_settings is preloaded in the root loader, so this cache read is safe.
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);
  const fromUrl = extractLocale(pathname, data.enabled_locales);
  if (fromUrl && isLocale(fromUrl)) return fromUrl;
  return isLocale(data.default_locale) ? (data.default_locale as Locale) : DEFAULT_LOCALE;
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
  // Sitewide defaults ONLY — no page-specific title/description, no canonical, no og:image.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "description", content: "A multi-tenant real estate platform template for brokers, enabling custom branding and features." },
      { property: "og:description", content: "A multi-tenant real estate platform template for brokers, enabling custom branding and features." },
      { name: "twitter:description", content: "A multi-tenant real estate platform template for brokers, enabling custom branding and features." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a7034afd-db1a-4c9d-ab7f-da969557b469/id-preview-a68dafa9--3c5a1702-f242-45c6-bbed-cd440fe3233e.lovable.app-1784885743157.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a7034afd-db1a-4c9d-ab7f-da969557b469/id-preview-a68dafa9--3c5a1702-f242-45c6-bbed-cd440fe3233e.lovable.app-1784885743157.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  // Preload config once per request; children re-read via ensureQueryData (dedup).
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
      context.queryClient.ensureQueryData(currentUserQueryOptions),
    ]);
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
  const lang = urlLocale ?? settings?.default_locale ?? DEFAULT_LOCALE;

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

