import type { CredentialGroup } from "@/lib/homepage/credentials";
import { cn } from "@/lib/utils";

type Props = {
  groups: CredentialGroup[];
  other: string[];
  /** Label for qualifications that belong to no listed institution. */
  otherLabel: string;
  className?: string;
};

/**
 * One row per certifying body: the institution named once on the left, what it
 * certifies on the right. Presentational only — the grouping rule lives in
 * @/lib/homepage/credentials so a clone with entirely different bodies renders
 * identically.
 */
export function CredentialGroups({ groups, other, otherLabel, className }: Props) {
  const rows = [
    ...groups,
    ...(other.length > 0
      ? [{ institution: otherLabel, description: "", items: other }]
      : []),
  ];
  if (rows.length === 0) return null;

  return (
    <ul className={cn("border-t border-border", className)}>
      {rows.map((row) => (
        <li
          key={row.institution}
          className="grid gap-x-10 gap-y-3 border-b border-border py-7 md:grid-cols-12 md:py-9"
        >
          <div className="md:col-span-4">
            <div className="font-heading text-2xl leading-tight md:text-[1.75rem]">
              {row.institution}
            </div>
          </div>
          <div className="md:col-span-8">
            {row.items.length > 0 ? (
              <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-base leading-relaxed md:text-lg">
                {row.items.map((item, index) => (
                  <li key={item} className="flex items-baseline gap-3">
                    {index > 0 ? (
                      <span className="text-muted-foreground" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : row.description ? (
              /* An institution with no listed qualification still states what
                 it certifies, rather than rendering an empty row. */
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {row.description}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
