import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";
import { splitListingImages, type GalleryImage } from "@/lib/listings/gallery-images";

type Props = {
  images: GalleryImage[];
  locale: Locale;
  title: string;
  /** Optional content laid over the lower part of the hero image. */
  overlay?: ReactNode;
};

/** Beyond this many images above the fold, the browser decides when to load. */
const EAGER = 3;

/**
 * Detail-page gallery: photographs only — plans and renderings are shown as
 * documents further down. Every image is server-rendered so the page is
 * complete without JavaScript; the browser lazy-loads everything below the
 * first few. Clicking opens a keyboard-driven full-screen viewer.
 */
export function ListingGallery({ images, locale, title, overlay }: Props) {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { photos } = splitListingImages(images);
  const list = photos.filter((i) => pickImageUrl(i.variants, "detail"));

  useEffect(() => {
    if (openIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIdx(null);
      if (e.key === "ArrowRight") setOpenIdx((i) => (i == null ? i : (i + 1) % list.length));
      if (e.key === "ArrowLeft")
        setOpenIdx((i) => (i == null ? i : (i - 1 + list.length) % list.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, list.length]);

  if (list.length === 0) {
    return <div className="aspect-[16/9] w-full rounded-media bg-muted" />;
  }

  const hero = list[0]!;
  const rest = list.slice(1);

  return (
    <>
      <div className="relative overflow-hidden rounded-media bg-muted">
        <button
          type="button"
          onClick={() => setOpenIdx(0)}
          aria-label={t("listings.detail.gallery_open")}
          className="group block aspect-[4/3] w-full md:aspect-[3/2]"
        >
          <img
            src={pickImageUrl(hero.variants, "detail") ?? ""}
            alt={pickLocalized(hero.alt_text, locale) || title}
            className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.02]"
          />
        </button>
        {overlay}
      </div>

      {rest.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {rest.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setOpenIdx(i + 1)}
              className="group aspect-[4/3] w-full overflow-hidden rounded-media bg-muted"
            >
              <img
                src={pickImageUrl(img.variants, "detail") ?? ""}
                alt={pickLocalized(img.alt_text, locale) || title}
                loading={i + 1 < EAGER ? undefined : "lazy"}
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      ) : null}

      {openIdx != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIdx(null)}
        >
          <img
            src={pickImageUrl(list[openIdx]!.variants, "detail") ?? ""}
            alt={pickLocalized(list[openIdx]!.alt_text, locale) || title}
            className="max-h-full max-w-full rounded-media object-contain"
          />
          <div
            className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <ViewerButton
              label={t("listings.detail.gallery_prev")}
              onClick={() => setOpenIdx((i) => (i == null ? i : (i - 1 + list.length) % list.length))}
            >
              ‹
            </ViewerButton>
            <span className="tabular-figures text-sm text-background/80">
              {openIdx + 1} / {list.length}
            </span>
            <ViewerButton
              label={t("listings.detail.gallery_next")}
              onClick={() => setOpenIdx((i) => (i == null ? i : (i + 1) % list.length))}
            >
              ›
            </ViewerButton>
          </div>
          <ViewerButton
            label={t("listings.detail.gallery_close")}
            className="absolute right-4 top-4"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIdx(null);
            }}
          >
            ×
          </ViewerButton>
        </div>
      ) : null}
    </>
  );
}

function ViewerButton({
  label,
  children,
  onClick,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-background/15 text-xl leading-none text-background transition-colors duration-300 hover:bg-background/30 ${className}`}
    >
      {children}
    </button>
  );
}
