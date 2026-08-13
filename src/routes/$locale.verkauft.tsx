import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { applySoldPricePolicy, soldPricesHidden } from "@/lib/homepage/plan";
import { PublicChrome } from "@/components/public/PublicChrome";
import { ListingCard } from "@/components/brand/ListingCard";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { listPublicListings } from "@/lib/listings/queries.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

const soldOpts = queryOptions({
  queryKey: ["listings", "sold-archive"],
  queryFn: () =>
    listPublicListings({
      data: {
        deal: "",
        type: "",
        city: "",
        rooms_min: 0,
        price_min: 0,
        price_max: 0,
        area_min: 0,
        sort: "newest",
        page: 1,
        onlyStatus: ["sold", "rented"],
        limit: 24,
      },
    } as any),
  staleTime: 60_000,
});

export const Route = createFileRoute("/$locale/verkauft")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(soldOpts),
    ]);
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale } = loaderData;
    const title = `${translate(locale, "listings.sold_title")} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}/verkauft`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "listings.sold_description"),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
    });
  },
  component: SoldArchive,
});

function SoldArchive() {
  const { locale } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data } = useSuspenseQuery(soldOpts);
  // Achieved prices stay hidden unless the client turns them on.
  const items = applySoldPricePolicy(data.items, settings);

  return (
    <PublicChrome locale={locale as Locale} settings={settings}>
      <section className="mx-auto max-w-[1400px] px-6 pt-24 lg:px-10">
        <h1 className="font-heading text-5xl md:text-6xl">{t("listings.sold_title")}</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          {t("listings.sold_description")}
        </p>

        {items.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            {t("listings.sold_empty")}
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                locale={locale as Locale}
                settings={settings}
                size="compact"
                hidePrice={soldPricesHidden(settings)}
              />
            ))}
          </div>
        )}
      </section>
    </PublicChrome>
  );
}
