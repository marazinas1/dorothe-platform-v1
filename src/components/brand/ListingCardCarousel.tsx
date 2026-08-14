import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { pickLocalized } from "@/lib/listings/format";
import { pickImageUrl } from "@/lib/listings/image";
import { cn } from "@/lib/utils";

type ImageInput = {
  id: string | null;
  variants: unknown;
  alt_text: unknown;
  sort_order: number | null;
  is_primary: boolean | null;
};

type Props = {
  images: ImageInput[];
  locale: Locale;
  /** Accessible name of the listing, used for the cover alt text. */
  name: string;
  /** Cover loads eagerly on the first row of a page. */
  eager?: boolean;
};

/** However many photos a listing carries, the dot row stays this short. */
const MAX_DOTS = 6;

/**
 * Card carousel as a CSS scroll-snap track: swipe on touch, arrows on hover for
 * pointer devices, dots for position. No motion library, and the markup renders
 * server-side unchanged.
 *
 * Every photo is browsable. Looping is seamless because the first photo is
 * cloned once at the end of the track: sliding past the last one scrolls into
 * that clone like any other slide, and once the scroll settles the track is
 * silently repositioned to the real first slide. The same trick runs backwards
 * from the first photo.
 *
 * Only the cover has a `src` on first paint — a catalogue of twenty cards costs
 * twenty images. The neighbouring slides are armed on the first interaction.
 *
 * The controls are hidden from keyboard and assistive tech on purpose: the card
 * is one tab stop and one target, and the full gallery lives on the detail page.
 */
export function ListingCardCarousel({ images, locale, name, eager = false }: Props) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current);
  }, []);

  const slides = images.filter((i) => pickImageUrl(i.variants, "card"));
  const total = slides.length;

  if (total === 0) {
    return <div className="aspect-[3/2] w-full rounded-media bg-muted" />;
  }

  // The clone of the cover, so the last -> first step is a normal slide move.
  const rendered = total > 1 ? [...slides, slides[0]!] : slides;

  const jump = (slot: number) => {
    const track = trackRef.current;
    track?.scrollTo({ left: slot * (track.clientWidth || 0), behavior: "auto" });
  };

  const step = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track || total < 2) return;
    setArmed(true);
    if (dir === 1) {
      // From the last photo, glide into the clone; onScroll snaps back after.
      track.scrollTo({ left: (index + 1) * track.clientWidth, behavior: "smooth" });
      setIndex(index + 1 >= total ? 0 : index + 1);
      return;
    }
    if (index === 0) {
      // Teleport to the clone first, then glide left into the real last photo.
      jump(total);
      requestAnimationFrame(() => {
        track.scrollTo({ left: (total - 1) * track.clientWidth, behavior: "smooth" });
      });
      setIndex(total - 1);
      return;
    }
    track.scrollTo({ left: (index - 1) * track.clientWidth, behavior: "smooth" });
    setIndex(index - 1);
  };

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    setArmed(true);
    setIndex(target);
    track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setArmed(true);
    const slot = Math.round(track.scrollLeft / track.clientWidth);
    setIndex(slot >= total ? 0 : slot);
    if (settle.current) clearTimeout(settle.current);
    // Once the scroll has come to rest on the clone, sit on the real cover.
    settle.current = setTimeout(() => {
      const t2 = trackRef.current;
      if (!t2 || t2.clientWidth === 0) return;
      if (Math.round(t2.scrollLeft / t2.clientWidth) >= total) jump(0);
    }, 140);
  };

  // A window of dots that follows the current photo, so forty photos still read
  // as a calm row of six.
  const dotStart = Math.max(0, Math.min(index - Math.floor(MAX_DOTS / 2), total - MAX_DOTS));
  const dotCount = Math.min(MAX_DOTS, total);

  return (
    <div
      className="group/media relative aspect-[3/2] w-full overflow-hidden rounded-media bg-muted"
      onPointerEnter={() => setArmed(true)}
      onTouchStart={() => setArmed(true)}
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
      >
        {rendered.map((img, i) => {
          const real = i === total ? 0 : i;
          const near =
            i === 0 ||
            (armed &&
              (Math.abs(i - index) <= 1 || (i === total && index >= total - 1) || real === index));
          const src = near ? pickImageUrl(img.variants, "card") : null;
          return (
            <div key={`${img.id ?? "i"}-${i}`} className="relative h-full w-full shrink-0 snap-center">
              {src ? (
                <img
                  src={src}
                  alt={i === 0 ? pickLocalized(img.alt_text, locale) || name : ""}
                  aria-hidden={i === 0 ? undefined : "true"}
                  loading={i === 0 && eager ? "eager" : "lazy"}
                  width={1200}
                  height={800}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
          );
        })}
      </div>

      {total > 1 ? (
        <>
          {/* Above the title link's inset overlay, so no event gymnastics. */}
          <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-between px-3 opacity-0 transition-opacity duration-300 group-hover/media:opacity-100 md:flex">
            <Arrow dir="prev" label={t("listings.card.prev_photo")} onClick={() => step(-1)} />
            <Arrow dir="next" label={t("listings.card.next_photo")} onClick={() => step(1)} />
          </div>

          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
            {Array.from({ length: dotCount }, (_, k) => dotStart + k).map((i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                  i === index ? "bg-card" : "bg-card/50",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function Arrow({
  dir,
  label,
  onClick,
}: {
  dir: "prev" | "next";
  label: string;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      title={label}
      onClick={onClick}
      className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-card/85 text-foreground transition-opacity duration-300 hover:opacity-100"
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}
