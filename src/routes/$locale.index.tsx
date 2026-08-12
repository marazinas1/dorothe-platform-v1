import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PublicChrome } from "@/components/public/PublicChrome";
import { Hero } from "@/components/brand/Hero";
import { CategoryGrid } from "@/components/brand/CategoryGrid";
import { FeaturedListings } from "@/components/brand/FeaturedListings";
import { SoldStrip } from "@/components/brand/SoldStrip";
import { AreaLinks } from "@/components/brand/AreaLinks";
import { AboutBroker } from "@/components/brand/AboutBroker";
import { CredibilityBar } from "@/components/brand/CredibilityBar";
import { ContactSection } from "@/components/brand/ContactSection";
import { TeamSection } from "@/components/brand/TeamSection";
import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { copyVars } from "@/lib/config/site-copy";
import {
  featuredListingsQueryOptions,
  recentSoldQueryOptions,
} from "@/lib/listings/queries.functions";
import {
  propertyTypeCountsQueryOptions,
  publicCitiesQueryOptions,
} from "@/lib/listings/counts.functions";
import { publicTeamQueryOptions } from "@/lib/team/queries.functions";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ context, params }) => {
    const [settings, origin] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(featuredListingsQueryOptions),
      context.queryClient.ensureQueryData(recentSoldQueryOptions),
      context.queryClient.ensureQueryData(propertyTypeCountsQueryOptions),
      context.queryClient.ensureQueryData(publicCitiesQueryOptions),
      context.queryClient.ensureQueryData(publicTeamQueryOptions),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
    ]);
    return { settings, origin, locale: params.locale as Locale };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale } = loaderData;
    const vars = copyVars(settings, locale);
    const title = `${translate(locale, "home.title", vars)} — ${settings.site_name}`;
    return buildHead({
      origin,
      path: `/${locale}`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: translate(locale, "home.description", vars),
      siteName: settings.site_name,
      ogDefaultImage: settings.og_default_image,
      ogType: "website",
    });
  },
  component: HomePage,
});

function HomePage() {
  const { locale } = Route.useParams();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: featured } = useSuspenseQuery(featuredListingsQueryOptions);
  const { data: sold } = useSuspenseQuery(recentSoldQueryOptions);
  const { data: counts } = useSuspenseQuery(propertyTypeCountsQueryOptions);
  const { data: cities } = useSuspenseQuery(publicCitiesQueryOptions);
  const { data: team } = useSuspenseQuery(publicTeamQueryOptions);
  const { data: flags } = useSuspenseQuery(featureFlagsQueryOptions);

  const sections = settings.homepage_sections ?? [];
  const l = locale as Locale;
  const teamEnabled = flags?.team?.enabled !== false;

  const renderers: Record<string, (section: (typeof sections)[number]) => ReactNode> = {
    hero: (section) => (
      <Hero
        locale={l}
        featured={featured.items}
        settings={settings}
        variant={section.variant ?? "region"}
        image={section.image}
      />
    ),
    categories: () => <CategoryGrid locale={l} counts={counts} />,
    featured: () => (
      <FeaturedListings locale={l} items={featured.items} settings={settings} />
    ),
    credibility: () => (
      <CredibilityBar locale={l} stats={settings.credibility_stats ?? []} settings={settings} />
    ),
    sold: () => <SoldStrip locale={l} items={sold.items} settings={settings} />,
    about: () => <AboutBroker locale={l} settings={settings} />,
    team: () => (teamEnabled && team.length > 0 ? <TeamSection members={team} /> : null),
    areas: () => <AreaLinks locale={l} cities={cities} />,
    contact: () => <ContactSection settings={settings} />,
  };

  return (
    <PublicChrome locale={l} settings={settings} heroOverlay>
      {sections
        .filter((s) => s.enabled)
        .map((s, i) => {
          const render = renderers[s.key];
          if (!render) return null;
          return <div key={`${s.key}-${i}`}>{render(s)}</div>;
        })}
    </PublicChrome>
  );
}
