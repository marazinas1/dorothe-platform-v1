import { Bath, BedDouble, LayoutGrid, Maximize } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { cardSpecs, type CardSpecIcon } from "@/lib/listings/card-specs";
import { energyClassTone } from "@/lib/listings/energy-class";
import { cn } from "@/lib/utils";

type Props = {
  listing: Parameters<typeof cardSpecs>[0];
  areaUnit: "sqm" | "sqft";
  locale: Locale;
};

/**
 * Icon + number, the convention buyers know from the portals: a ruler for
 * a square with expanding corners for area, a divided floor for rooms, a bed, a tub. Each icon is decorative and
 * the number carries a visually hidden label, so a screen reader hears
 * "Wohnfläche 162 m²" rather than "162".
 *
 * The row always renders — an empty row keeps its height so cards in a grid
 * cannot end at different heights.
 */
const ICONS: Record<CardSpecIcon, typeof Maximize> = {
  area: Maximize,
  rooms: LayoutGrid,
  bedrooms: BedDouble,
  bathrooms: Bath,
};

export function ListingCardSpecs({ listing, areaUnit, locale }: Props) {
  const { t } = useTranslation();
  const { specs, energyClass } = cardSpecs(listing, areaUnit, locale);

  return (
    <ul className="flex min-h-[1.75rem] flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
      {specs.map((spec) => {
        const Icon = ICONS[spec.key];
        const label = t(spec.labelKey);
        return (
          <li key={spec.key} className="inline-flex items-center gap-1.5" title={label}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">{label}</span>
            <span className="tabular-figures">{spec.value}</span>
          </li>
        );
      })}
      {energyClass ? (
        <li className="inline-flex items-center gap-1.5">
          <span className="sr-only">{t("listings.facts.energy_class")}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
              energyClassTone(energyClass),
            )}
            aria-hidden="true"
            title={t("listings.facts.energy_class")}
          >
            {energyClass}
          </span>
        </li>
      ) : null}
    </ul>
  );
}
