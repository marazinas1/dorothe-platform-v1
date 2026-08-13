import type { Locale } from "@/i18n/config";

import { formatArea } from "./format";
import { energyClassOf } from "./energy-class";

/**
 * The card's spec row, decided in one place. Icons are named, not imported, so
 * this stays a pure data function and the component owns the glyph mapping.
 *
 * Order follows the portals a buyer already reads: area, rooms, bedrooms,
 * bathrooms. The energy class is returned separately because it is a legal
 * disclosure and a letter grade — it stays textual, never an icon.
 */
export type CardSpecIcon = "area" | "rooms" | "bedrooms" | "bathrooms";

export type CardSpec = {
  key: CardSpecIcon;
  /** Rendered next to the icon. */
  value: string;
  /** Accessible label key — an icon plus a number says nothing to a reader. */
  labelKey: string;
};

type SpecInput = {
  property_type?: string | null;
  living_area?: number | null;
  plot_area?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  energy?: unknown;
};

export function cardSpecs(
  listing: SpecInput,
  areaUnit: "sqm" | "sqft",
  locale: Locale,
): { specs: CardSpec[]; energyClass: string | null } {
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    maximumFractionDigits: 1,
  });
  const specs: CardSpec[] = [];

  const isLand = listing.property_type === "land";
  const area = formatArea(
    isLand ? listing.plot_area : listing.living_area,
    areaUnit,
    locale,
  );
  if (area !== "—") {
    specs.push({
      key: "area",
      value: area,
      labelKey: isLand ? "listings.detail.plot_area" : "listings.detail.living_area",
    });
  }
  if (listing.rooms != null) {
    specs.push({
      key: "rooms",
      value: nf.format(listing.rooms),
      labelKey: "listings.detail.rooms",
    });
  }
  if (listing.bedrooms != null) {
    specs.push({
      key: "bedrooms",
      value: String(listing.bedrooms),
      labelKey: "listings.detail.bedrooms",
    });
  }
  if (listing.bathrooms != null) {
    specs.push({
      key: "bathrooms",
      value: String(listing.bathrooms),
      labelKey: "listings.detail.bathrooms",
    });
  }

  return { specs, energyClass: energyClassOf(listing.energy) };
}
