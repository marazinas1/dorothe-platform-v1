import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { PublicChrome } from "@/components/public/PublicChrome";
import { ShareButtons } from "@/components/public/ShareButtons";
import { ListingGallery } from "@/components/brand/ListingGallery";
import { ListingHeroOverlay } from "@/components/brand/ListingHeroOverlay";
import { ListingFactsBar } from "@/components/brand/ListingFactsBar";
import { ListingFeatures } from "@/components/brand/ListingFeatures";
import { ListingSpecs } from "@/components/brand/ListingSpecs";
import { ListingHeadline } from "@/components/brand/ListingHeadline";
import { ListingContentSections } from "@/components/brand/ListingContentSections";
import { EnergyPanel } from "@/components/brand/EnergyPanel";
import { ListingAgent } from "@/components/brand/ListingAgent";
import { ListingLocationMap } from "@/components/brand/ListingLocationMap";

import type { Locale } from "@/i18n/config";
import { translate } from "@/i18n/config";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import {
  getListingBySlug,
  resolveSupersededSlug,
  type PublicListing,
} from "@/lib/listings/queries.functions";
import { getListingPreview } from "@/lib/listings/preview.functions";
import { countListingView } from "@/lib/listings/views.functions";
import { useCountListingView } from "@/lib/listings/use-count-view";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";
import { getRequestOrigin } from "@/lib/seo/origin.functions";
import { buildHead } from "@/lib/seo/build-head";

function slugQueryOptions(slug: string, preview?: string) {
  return queryOptions({
    queryKey: ["listings", "slug", slug, preview ?? null],
    queryFn: () =>
      preview
        ? getListingPreview({ data: { slug, token: preview } })
        : getListingBySlug({ data: { slug } }),
    staleTime: preview ? 0 : 30_000,
  });
}

export const Route = createFileRoute("/$locale/immobilien/$slug")({
  // Optional search param: links to this route must not be forced to pass one.
  validateSearch: (search: Record<string, unknown>): { preview?: string } =>
    typeof search.preview === "string" ? { preview: search.preview } : {},
  loaderDeps: ({ search }) => ({ preview: search.preview }),
  loader: async ({ context, params, deps }) => {
    const [settings, origin, listing] = await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions),
      getRequestOrigin(),
      context.queryClient.ensureQueryData(slugQueryOptions(params.slug, deps.preview)),
    ]);
    if (!listing) {
      // The slug may have been replaced deliberately; old links must not 404.
      const current = deps.preview
        ? null
        : await resolveSupersededSlug({ data: { slug: params.slug } });
      if (current && current !== params.slug) {
        throw redirect({
          to: "/$locale/immobilien/$slug",
          params: { locale: params.locale, slug: current },
          statusCode: 301,
        });
      }
      throw notFound();
    }
    // One page view per render. On the server it is counted here; on a
    // client-side navigation the component counts it after mounting, so a
    // hover-preload of this route never counts. Admin previews never count and
    // the call is fire-and-forget: a counting failure cannot fail the page.
    const countedOnServer = import.meta.env.SSR && !deps.preview;
    if (countedOnServer) {
      void countListingView({ data: { listing_id: listing.id } }).catch(() => {});
    }

    return {
      settings,
      origin,
      listing,
      locale: params.locale as Locale,
      isPreview: Boolean(deps.preview),
      countedOnServer,
    };
  },

  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [
          {
            title: translate(
              (params.locale as Locale) ?? "de",
              "listings.detail.unavailable_title",
            ),
          },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { settings, origin, locale, isPreview } = loaderData;
    const listing = loaderData.listing as PublicListing;
    const localTitle = pickLocalized(listing.title, locale) || listing.slug;
    const localDesc = pickLocalized(listing.description, locale);
    const title = `${localTitle} — ${settings.site_name}`;
    const primary = listing.images.find((i) => i.is_primary) ?? listing.images[0];
    const ogImage =
      pickImageUrl(primary?.variants, "og") ?? pickImageUrl(primary?.variants, "detail");

    const head = buildHead({
      origin,
      path: `/${locale}/immobilien/${listing.slug}`,
      locale,
      enabledLocales: settings.enabled_locales,
      defaultLocale: settings.default_locale,
      title,
      description: localDesc.slice(0, 160) || settings.site_name,
      siteName: settings.site_name,
      ogImage,
      ogDefaultImage: settings.og_default_image,
      ogType: "product",
    });

    const priceObj =
      listing.price != null
        ? {
            "@type": "MonetaryAmount",
            currency: settings.currency,
            value: listing.price,
          }
        : undefined;
    const ldJson = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      name: localTitle,
      description: localDesc,
      url: `${origin}/${locale}/immobilien/${listing.slug}`,
      ...(ogImage ? { image: ogImage } : {}),
      ...(priceObj ? { price: priceObj } : {}),
      address:
        listing.geo_precision !== "hidden"
          ? {
              "@type": "PostalAddress",
              addressLocality: listing.address_city,
              postalCode: listing.address_zip,
              addressCountry: listing.address_country,
              streetAddress: listing.address_street ?? undefined,
            }
          : undefined,
      floorSize:
        listing.living_area != null
          ? {
              "@type": "QuantitativeValue",
              value: listing.living_area,
              unitCode: settings.area_unit === "sqft" ? "FTK" : "MTK",
            }
          : undefined,
      numberOfRooms: listing.rooms ?? undefined,
    };

    // A preview URL must never be indexed, even if someone shares the link.
    if (isPreview) {
      return {
        ...head,
        meta: [...(head.meta ?? []), { name: "robots", content: "noindex, nofollow" }],
      };
    }

    return {
      ...head,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(ldJson) }],
    };
  },
  component: ListingDetail,
  notFoundComponent: NotFoundBody,
});

function NotFoundBody() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-[900px] px-6 py-32 lg:px-10">
      <h1 className="font-heading text-4xl">{t("listings.detail.unavailable_title")}</h1>
      <p className="mt-4 text-muted-foreground">{t("listings.detail.unavailable_body")}</p>
    </div>
  );
}

function ListingDetail() {
  const { locale, slug } = Route.useParams();
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { preview } = Route.useSearch();
  const { data: listing } = useSuspenseQuery(slugQueryOptions(slug, preview));
  const { origin, countedOnServer } = Route.useLoaderData();
  useCountListingView(listing?.id, {
    skip: countedOnServer || Boolean(preview),
  });

  if (!listing) return null;
  const l = listing as PublicListing;
  const title = pickLocalized(l.title, locale) || l.slug;
  const shareUrl = `${origin}/${locale}/immobilien/${l.slug}`;

  const locationLine =
    l.geo_precision === "hidden"
      ? [l.address_zip, l.address_city].filter(Boolean).join(" ")
      : [l.address_street, l.address_zip, l.address_city].filter(Boolean).join(" · ");

  return (
    <PublicChrome locale={locale as Locale} settings={settings} heroOverlay>
      <article className="pb-40">
        {preview ? (
          <div className="bg-secondary px-6 py-2 text-center text-[11px] uppercase tracking-[0.16em] text-secondary-foreground">
            {t("listings.detail.preview_notice", {
              status: t(`listings.status.${l.status}`),
            })}
          </div>
        ) : null}
        {/* 1. Hero gallery + overlaid headline */}
        <section className="mx-auto max-w-[1600px] px-3 pt-6 sm:px-6 lg:px-8">
          <ListingGallery
            images={l.images}
            locale={locale as Locale}
            title={title}
            overlay={
              <ListingHeroOverlay
                title={title}
                locationLine={locationLine}
                contactHref="#kontakt"
              />
            }
          />
        </section>

        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
          {/* 2. Facts */}
          <section className="mt-20">
            <ListingFactsBar
              listing={l}
              locale={locale as Locale}
              settings={settings}
            />
          </section>

          {/* 2b. Equipment features */}
          <section className="mt-20">
            <ListingFeatures features={l.features} />
          </section>

          {/* 3. Description */}
          <section className="mt-28">
            <ListingHeadline listing={l} locale={locale as Locale} />
          </section>

          {/* 3b. Full specification, generated from the structured fields */}
          <section className="mt-28">
            <ListingSpecs listing={l} locale={locale as Locale} settings={settings} />
          </section>

          {/* 4. Content sections */}
          <section className="mt-32">
            <ListingContentSections
              sections={l.content_sections}
              locale={locale as Locale}
            />
          </section>

          {/* 5. Energy panel */}
          <section className="mt-32">
            <EnergyPanel energy={l.energy} propertyType={l.property_type} />
          </section>

          {/* 6. Location map — precision-aware, hydrates on the client */}
          <section className="mt-32">
            <ListingLocationMap listing={l} locale={locale as Locale} />
          </section>


          {/* 7. Agent + inquiry */}
          <section id="kontakt" className="mt-32 scroll-mt-32">
            <ListingAgent listingId={l.id} settings={settings} />
          </section>

          {/* 8. Share */}
          <section className="mt-24">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("listings.detail.share")}
            </div>
            <div className="mt-4">
              <ShareButtons url={shareUrl} title={title} />
            </div>
          </section>
        </div>
      </article>
    </PublicChrome>
  );
}
