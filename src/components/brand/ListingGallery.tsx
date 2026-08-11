import { useEffect, useState, type ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import { pickImageUrl } from "@/lib/listings/image";
import { pickLocalized } from "@/lib/listings/format";

type ImageInput = {
  id: string | null;
  variants: any;
  alt_text: any;
  sort_order: number | null;
  is_primary: boolean | null;
};

type Props = {
  images: ImageInput[];
  locale: Locale;
  title: string;
  /** Optional content laid over the lower part of the hero image. */
  overlay?: ReactNode;
};

/**
 * Detail-page gallery. Full-width hero with uniform media radius, then a
 * row of secondary shots. Everything opens a keyboard-driven lightbox.
 */
export function ListingGallery({ images, locale, title, overlay }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const list = images.filter((i) => pickImageUrl(i.variants, "detail"));

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
  const rest = list.slice(1, 5);

  return (
    <>
      <div className="relative overflow-hidden rounded-media bg-muted">
        <button
          type="button"
          onClick={() => setOpenIdx(0)}
          aria-label={title}
          className="group block aspect-[4/3] w-full md:aspect-[21/9]"
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
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {rest.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setOpenIdx(i + 1)}
              className="group aspect-[4/3] w-full overflow-hidden rounded-media bg-muted"
            >
              <img
                src={pickImageUrl(img.variants, "card") ?? ""}
                alt={pickLocalized(img.alt_text, locale) || title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      ) : null}

      {openIdx != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6"
          onClick={() => setOpenIdx(null)}
        >
          <img
            src={pickImageUrl(list[openIdx]!.variants, "detail") ?? ""}
            alt={pickLocalized(list[openIdx]!.alt_text, locale) || title}
            className="max-h-full max-w-full rounded-media object-contain"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIdx(null);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white transition-colors duration-500 hover:bg-white/20"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
