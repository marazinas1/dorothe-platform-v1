// Shape and pure helpers for the first-party analytics summary. No imports of
// server or browser code, so both sides can use it.

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export interface AnalyticsSummary {
  totals: { views: number; visitors: number };
  previous: { views: number; visitors: number };
  daily: { day: string; views: number; visitors: number }[];
  top_pages: { path: string; views: number }[];
  sources: { source: string; views: number }[];
  devices: { device: string; views: number }[];
  inquiries: number;
}

export const EMPTY_SUMMARY: AnalyticsSummary = {
  totals: { views: 0, visitors: 0 },
  previous: { views: 0, visitors: 0 },
  daily: [],
  top_pages: [],
  sources: [],
  devices: [],
  inquiries: 0,
};

/** UTC day, `offsetDays` before today. The table stores UTC days. */
export function isoDay(offsetDays: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

export function isAnalyticsRange(value: unknown): value is AnalyticsRange {
  return (ANALYTICS_RANGES as readonly unknown[]).includes(value);
}

/** Null means "no comparable previous period", which is not the same as 0%. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Fills every day in the range so the chart never draws a broken series. */
export function buildSeries(
  daily: AnalyticsSummary["daily"],
  range: AnalyticsRange,
  now: Date = new Date(),
): { day: string; views: number; visitors: number }[] {
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const out: { day: string; views: number; visitors: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const key = isoDay(i, now);
    const row = byDay.get(key);
    out.push({
      day: key,
      views: Number(row?.views ?? 0),
      visitors: Number(row?.visitors ?? 0),
    });
  }
  return out;
}
