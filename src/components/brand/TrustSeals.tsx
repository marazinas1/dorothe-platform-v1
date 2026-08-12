import type { Locale } from "@/i18n/config";
import { pickLocalized } from "@/lib/listings/format";
import { cn } from "@/lib/utils";
import type { Seal } from "@/types/site-settings";

type Props = {
  locale: Locale;
  items: Seal[];
  title?: string;
  className?: string;
};

/**
 * Certification / membership seals from site_settings.seals. Presentational
 * only: a clone changes data, never this component.
 */
export function TrustSeals({ locale, items, title, className }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={cn("mx-auto max-w-[1400px] px-6 lg:px-10", className)}>
      <div className="flex flex-col gap-8 border-t border-border/60 pt-10 md:flex-row md:items-center md:gap-14">
        {title ? <p className="eyebrow md:w-48 md:shrink-0">{title}</p> : null}
        <ul className="flex flex-wrap items-center gap-8 md:gap-12">
          {items.map((seal) => {
            const label = pickLocalized(seal.label, locale) ?? "";
            const img = (
              <img
                src={seal.url}
                alt={label}
                loading="lazy"
                decoding="async"
                className="h-24 w-auto object-contain md:h-28"
              />
            );
            return (
              <li key={seal.url} className="flex items-center gap-4">
                {seal.href ? (
                  <a
                    href={seal.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="transition-opacity duration-300 hover:opacity-80"
                  >
                    {img}
                  </a>
                ) : (
                  img
                )}
                {label ? (
                  <span className="max-w-[14rem] text-sm text-muted-foreground">{label}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
