// The period the metrics half of the dashboard is read against. Pure date math,
// so it is testable and identical on server and client.

export const PERIOD_PRESETS = ["7d", "30d", "90d", "ytd"] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const DEFAULT_PERIOD: PeriodPreset = "30d";

export interface PeriodBounds {
  /** Inclusive lower bound, ISO. */
  from: string;
  /** Exclusive upper bound, ISO. */
  to: string;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Bounds are [from, to): whole days, ending at the start of tomorrow, so
 * "last 30 days" always contains today in full and never double-counts.
 */
export function resolvePeriod(preset: PeriodPreset, now: Date = new Date()): PeriodBounds {
  const to = startOfDay(now);
  to.setDate(to.getDate() + 1);

  const from = startOfDay(now);
  if (preset === "ytd") {
    from.setMonth(0, 1);
  } else {
    const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
    from.setDate(from.getDate() - (days - 1));
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export function isPeriodPreset(value: unknown): value is PeriodPreset {
  return (PERIOD_PRESETS as readonly unknown[]).includes(value);
}
