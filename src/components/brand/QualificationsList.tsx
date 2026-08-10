import { cn } from "@/lib/utils";

type Props = {
  items: string[];
  title: string;
  /** Optional intro line, e.g. the valuation-page credential note. */
  note?: string;
  className?: string;
};

/**
 * Calm two-column list of professional qualifications. Values always come from
 * site_settings.qualifications, the heading from translations.
 */
export function QualificationsList({ items, title, note, className }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={cn("mx-auto max-w-[1400px] px-6 lg:px-10", className)}>
      <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 className="font-heading text-3xl leading-[1.1] md:text-4xl">{title}</h2>
          {note ? (
            <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">{note}</p>
          ) : null}
        </div>
        <div className="md:col-span-8">
          <ul className="space-y-6 border-t border-border pt-8 text-lg">
            {items.map((q, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-3 h-px w-8 shrink-0 bg-foreground" aria-hidden />
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
