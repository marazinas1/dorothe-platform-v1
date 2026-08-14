import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
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

/** Nobody browses forty photos on a card; the rest are behind the link. */
const MAX_SLIDES = 6;

/**
 * Card carousel as a CSS scroll-snap track: swipe on touch, arrows on hover for
 * pointer devices, dots for position. No motion library, and the markup renders
 * server-side unchanged.
 *
 * Only the cover has a `src` on first paint — a catalogue of twenty cards costs
 * twenty images, exactly what it cost before. The remaining slides are armed on
 * the first interaction (pointer entering the media, a swipe, an arrow, a dot),
 * and then only the current neighbourhood loads.
 *
 * The controls are hidden from keyboard and assistive tech on purpose: the card
 * is one tab stop and one target, and the full gallery lives on the detail page.
 */
export function ListingCardCarousel({ images, locale, name, eager = false }: Props) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState(0);

  const usable = images.filter((i) => pickImageUrl(i.variants, "card"));
  const slides = usable.slice(0, MAX_SLIDES);
  const overflow = usable.length - slides.length;

  if (slides.length === 0) {
    return <div className="aspect-[3/2] w-full rounded-media bg-muted" />;
  }

  /**
   * The track is a finite scroll-snap row, so looping is done by hand: stepping
   * past either end jumps to the opposite end instantly (a smooth scroll across
   * every slide would read as a rewind, not a loop).
   */
  const goTo = (next: number) => {
    const track = trackRef.current;
    const last = slides.length - 1;
    const wrapped = next > last ? 0 : next < 0 ? last : next;
    const jumped = wrapped !== next;
    setArmed(true);
    setIndex(wrapped);
    track?.scrollTo({
      left: wrapped * track.clientWidth,
      behavior: jumped ? "auto" : "smooth",
    });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setArmed(true);
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  // Touch swipes are native scrolling, which cannot pass the last slide — so a
  // swipe that ends at an edge wraps the same way the arrows do.
  const touchX = useRef<number | null>(null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    const track = trackRef.current;
    if (start == null || !track || slides.length < 2) return;
    const delta = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(delta) < 40) return;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    const atStart = track.scrollLeft <= 2;
    if (delta < 0 && atEnd) goTo(slides.length);
    if (delta > 0 && atStart) goTo(-1);
  };


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
        {slides.map((img, i) => {
          const near = i === 0 || (armed && Math.abs(i - index) <= 1);
          const src = near ? pickImageUrl(img.variants, "card") : null;
          return (
            <div key={img.id ?? i} className="relative h-full w-full shrink-0 snap-center">
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
              {i === slides.length - 1 && overflow > 0 ? (
                <span className="absolute right-3 bottom-3 rounded-full bg-card/85 px-3 py-1 text-xs text-foreground">
                  {t("listings.card.more_photos", { count: overflow })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {slides.length > 1 ? (
        <>
          {/* Above the title link's inset overlay, so no event gymnastics. */}
          <div className="pointer-events-none absolute inset-0 z-20 hidden items-center justify-between px-3 opacity-0 transition-opacity duration-300 group-hover/media:opacity-100 md:flex">
            <Arrow
              dir="prev"
              label={t("listings.card.prev_photo")}
              onClick={() => goTo(index - 1)}
            />
            <Arrow
              dir="next"
              label={t("listings.card.next_photo")}
              onClick={() => goTo(index + 1)}
            />
          </div>

          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1.5">
            {slides.map((_, i) => (
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
