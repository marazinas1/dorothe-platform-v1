import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PublicChrome } from "@/components/public/PublicChrome";
import { Hero } from "@/components/brand/Hero";
import { TwoPaths } from "@/components/brand/TwoPaths";
import { WhyHer } from "@/components/brand/WhyHer";
import { ValuationInvite } from "@/components/brand/ValuationInvite";
import { FeaturedListings } from "@/components/brand/FeaturedListings";
import { SoldStrip } from "@/components/brand/SoldStrip";
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
import { publicCitiesQueryOptions } from "@/lib/listings/counts.functions";
import { publicTeamQueryOptions } from "@/lib/team/queries.functions";
import { featureFlagsQueryOptions } from "@/lib/config/feature-flags.functions";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";
import {
  HOMEPAGE_LISTING_LIMIT,
  applySoldPricePolicy,
  buildHomepagePlan,
  heroCopy,
  resolveSocialImage,
  soldPricesHidden,
  valuationOffer,
} from "@/lib/homepage/plan";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ context, params }) => {
    const [settings, origin, featured] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(featuredListingsQueryOptions),
      context.queryClient.ensureQueryData(recentSoldQueryOptions),
      context.queryClient.ensureQueryData(publicCitiesQueryOptions),
      context.queryClient.ensureQueryData(publicTeamQueryOptions),
      context.queryClient.ensureQueryData(featureFlagsQueryOptions),
    ]);
    return {
      settings,
      origin,
      locale: params.locale as Locale,
      socialImage: resolveSocialImage(settings, featured.items),
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "…" }] };
    const { settings, origin, locale, socialImage } = loaderData;
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
      ogDefaultImage: socialImage,
      ogType: "website",
    });
  },
  component: HomePage,
});

/**
 * The homepage is a block library: `site_settings.homepage_sections` decides
 * which blocks appear and in which order. This file composes only — every
 * decision (hero layout, portrait interlock, price masking) is resolved in
 * @/lib/homepage/plan so a differently ordered client behaves identically.
 */
function HomePage() {
  const { locale } = Route.useParams();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { data: featured } = useSuspenseQuery(featuredListingsQueryOptions);
  const { data: sold } = useSuspenseQuery(recentSoldQueryOptions);
  const { data: cities } = useSuspenseQuery(publicCitiesQueryOptions);
  const { data: team } = useSuspenseQuery(publicTeamQueryOptions);
  const { data: flags } = useSuspenseQuery(featureFlagsQueryOptions);

  const l = locale as Locale;
  const sections = settings.homepage_sections ?? [];
  const plan = buildHomepagePlan(settings, sections);
  const copy = heroCopy(settings, l);
  const teamEnabled = flags?.team?.enabled !== false;
  const shown = featured.items.slice(0, HOMEPAGE_LISTING_LIMIT);
  const soldShown = applySoldPricePolicy(sold.items.slice(0, HOMEPAGE_LISTING_LIMIT), settings);

  const renderers: Record<string, () => ReactNode> = {
    hero: () => (
      <Hero
        locale={l}
        settings={settings}
        layout={plan.heroLayout}
        image={plan.heroImage}
        headline={copy.headline}
        subline={copy.subline}
      />
    ),
    paths: () => <TwoPaths locale={l} />,
    credibility: () => <WhyHer locale={l} settings={settings} />,
    featured: () => <FeaturedListings locale={l} items={shown} settings={settings} />,
    sold: () => <SoldStrip locale={l} items={soldShown} settings={settings} hidePrice={soldPricesHidden(settings)} />,
    valuation: () => <ValuationInvite locale={l} offer={valuationOffer(settings, l)} />,
    team: () => (teamEnabled && team.length > 0 ? <TeamSection members={team} /> : null),
    contact: () => <ContactSection locale={l} settings={settings} />,
  };

  return (
    <PublicChrome locale={l} settings={settings}>
      {sections
        .filter((s) => s.enabled)
        .map((s, i) => {
          const render = renderers[s.key];
          if (!render) return null;
          return <div key={`${s.key}-${i}`}>{render()}</div>;
        })}
    </PublicChrome>
  );
}
