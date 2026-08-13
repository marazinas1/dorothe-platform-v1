import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";
import { splitListingImages, type GalleryImage } from "@/lib/listings/gallery-images";

type Props = {
  images: GalleryImage[];
  locale: Locale;
};

/**
 * Floor plans and renderings, out of the photo gallery. A rendering is labelled
 * as one so nobody mistakes a visualisation for a photograph of what exists.
 */
export function ListingFloorPlans({ images, locale }: Props) {
  const { t } = useTranslation();
  const { floorplans, visualizations } = splitListingImages(images);
  const items = [
    ...floorplans.map((i) => ({ img: i, kind: "floorplan" as const })),
    ...visualizations.map((i) => ({ img: i, kind: "visualization" as const })),
  ].filter((i) => pickImageUrl(i.img.variants, "detail"));

  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
        {t("listings.detail.sections.plans")}
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {items.map(({ img, kind }, i) => (
          <figure key={img.id ?? i}>
            <a
              href={pickImageUrl(img.variants, "detail") ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-media border border-border bg-background"
            >
              <img
                src={pickImageUrl(img.variants, "detail") ?? ""}
                alt={pickLocalized(img.alt_text, locale) || t(`listings.detail.${kind}`)}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-contain p-3"
              />
            </a>
            <figcaption className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {pickLocalized(img.caption, locale) || t(`listings.detail.${kind}`)}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
