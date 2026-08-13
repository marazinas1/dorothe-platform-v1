type Props = {
  /** Resolved by the homepage plan; already de-duplicated and capped. */
  images: string[];
};

/**
 * Decorative strip of property photography between the hero and the
 * introduction. It carries no links and no captions — it exists to show that
 * real properties sit behind the words. Hidden entirely when there are fewer
 * than three photographs, because two look like a mistake.
 */
export function PhotoBand({ images }: Props) {
  if (images.length < 3) return null;

  return (
    <section aria-hidden="true" className="mt-24 overflow-hidden">
      <div className="flex gap-2 md:gap-3">
        {images.map((src) => (
          <div
            key={src}
            className="h-40 w-[42%] shrink-0 overflow-hidden bg-muted sm:w-[30%] md:h-56 md:w-[22%] lg:w-[16%]"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
