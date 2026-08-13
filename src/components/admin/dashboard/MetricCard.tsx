import type { ReactNode } from "react";

/**
 * One figure. A null value renders a dash, never a zero: "no data yet" and
 * "measured zero" are different statements and the dashboard must not confuse
 * them.
 */
export function MetricCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: number | string | null;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl tabular-nums">
        {value === null || value === "" ? (
          <span className="text-muted-foreground">&mdash;</span>
        ) : (
          value
        )}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}

export function MetricBreakdown({
  rows,
}: {
  rows: { label: string; value: number }[];
}) {
  if (rows.length === 0) return null;
  return (
    <ul className="mt-3 grid gap-0.5 border-t border-border pt-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">{row.label}</span>
          <span className="tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}
