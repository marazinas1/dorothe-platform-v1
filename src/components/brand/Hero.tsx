import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import brokerPlaceholder from "@/assets/broker-placeholder.jpg";
import type { Locale } from "@/i18n/config";
import type { PublicListing } from "@/lib/listings/queries.functions";
import { pickImageUrl } from "@/lib/listings/image";
import { formatArea, formatPrice, pickLocalized } from "@/lib/listings/format";
import type { HeroVariant, SiteSettings } from "@/types/site-settings";

import { Signature } from "./Signature";
import { HERO_FALLBACK_IMAGE, HeroFact, HeroFrame } from "./HeroFrame";

type Props = {
  locale: Locale;
  featured: PublicListing[];
  settings: SiteSettings;
  variant?: HeroVariant;
  /** Section photograph configured in site_settings.homepage_sections. */
  image?: string | null;
};

/**
 * Homepage hero. Three variants, chosen by `homepage_sections[hero].variant`:
 *  - region:   full-bleed photograph, positioning line, signature and one CTA.
 *  - property: the first featured listing carries the hero.
 *  - broker:   portrait alongside the positioning line.
 * All copy and imagery come from site_settings + listings — no hardcoded strings.
 */
export function Hero({ locale, featured, settings, variant = "region", image }: Props) {
  if (variant === "property")
    return <PropertyHero locale={locale} featured={featured} settings={settings} />;
  if (variant === "broker") return <BrokerHero settings={settings} />;
  return <RegionHero settings={settings} featured={featured} locale={locale} image={image} />;
}

/** Sage call to action — the single filled button style on the site. */
function HeroCta({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Link
      to="/$locale/immobilien"
      params={{ locale }}
      className="eyebrow inline-flex h-12 items-center rounded-sm bg-primary px-7 text-primary-foreground transition-opacity duration-300 hover:opacity-90"
    >
      {label}
    </Link>
  );
}

function RegionHero({
  settings,
  featured,
  locale,
  image,
}: {
  settings: SiteSettings;
  featured: PublicListing[];
  locale: Locale;
  image?: string | null;
}) {
  const { t } = useTranslation();
  const fallback = featured[0]
    ? pickImageUrl(featured[0].images[0]?.variants, "detail")
    : null;
  const src = image?.trim() || fallback || HERO_FALLBACK_IMAGE;

  return (
    <HeroFrame image={src} alt="">
      <h1 className="text-hero max-w-4xl text-white">{t("home.hero_line")}</h1>
      <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-6">
        <HeroCta locale={locale} label={t("home.hero_cta")} />
        <Signature name={settings.primary_agent_name} tone="on-photo" size="md" />
      </div>
    </HeroFrame>
  );
}

function PropertyHero({
  locale,
  featured,
  settings,
}: {
  locale: Locale;
  featured: PublicListing[];
  settings: SiteSettings;
}) {
  const { t } = useTranslation();
  const first = featured[0];
  if (!first) {
    return <RegionHero settings={settings} featured={featured} locale={locale} />;
  }
  const image = pickImageUrl(first.images[0]?.variants, "detail") ?? HERO_FALLBACK_IMAGE;
  const title = pickLocalized(first.title, locale) || first.slug;
  const price = formatPrice(first.price, settings.currency, locale, {
    onRequest: first.price_on_request,
    period: first.price_period,
    onRequestLabel: t("listings.on_request"),
  });
  const location =
    first.geo_precision === "hidden"
      ? [first.address_zip, first.address_city].filter(Boolean).join(" ")
      : [first.address_street, first.address_zip, first.address_city]
          .filter(Boolean)
          .join(" · ");
  const area =
    first.living_area != null
      ? formatArea(first.living_area, settings.area_unit, locale)
      : null;
  const dealLabel = t(first.deal_type === "rent" ? "listings.for_rent" : "listings.for_sale");

  return (
    <HeroFrame image={image} alt={title}>
      <div className="eyebrow text-white/80">
        {first.reference_code
          ? `${t("listings.detail.reference")} · ${first.reference_code}`
          : dealLabel}
      </div>
      <h1 className="text-hero mt-4 max-w-4xl text-white">
        <Link to="/$locale/immobilien/$slug" params={{ locale, slug: first.slug }}>
          {title}
        </Link>
      </h1>
      {location ? <p className="mt-4 text-sm text-white/85">{location}</p> : null}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-12 gap-y-4 border-t border-white/25 pt-6">
        <HeroFact label={dealLabel} value={price} />
        {area ? <HeroFact label={t("listings.detail.living_area")} value={area} /> : null}
        {first.rooms != null ? (
          <HeroFact label={t("listings.detail.rooms")} value={String(first.rooms)} />
        ) : null}
      </div>
    </HeroFrame>
  );
}

function BrokerHero({ settings }: { settings: SiteSettings }) {
  const { t } = useTranslation();
  const photo =
    settings.primary_agent_photo_url && settings.primary_agent_photo_url.trim().length > 0
      ? settings.primary_agent_photo_url
      : brokerPlaceholder;

  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-28 pb-24 lg:px-10 lg:pt-36 lg:pb-32">
      <div className="grid items-end gap-12 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-7">
          <div className="eyebrow text-muted-foreground">{settings.site_name}</div>
          <h1 className="text-hero mt-6">{t("home.hero_line")}</h1>
          <div className="mt-8">
            <Signature name={settings.primary_agent_name} size="md" />
          </div>
          {settings.primary_agent_role ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {settings.primary_agent_role}
            </p>
          ) : null}
        </div>
        <div className="md:col-span-5">
          <img
            src={photo}
            alt={settings.primary_agent_name ?? ""}
            className="h-[70vh] w-full object-cover"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
