// "How long has this been sitting here" — the only number the queue needs about
// time. Returns a translation key plus its count, so the wording stays in the
// message files and pluralisation stays with i18next.

export interface AgeLabel {
  key: string;
  count: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function ageLabel(iso: string | null | undefined, now: Date = new Date()): AgeLabel | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const elapsed = Math.max(now.getTime() - then, 0);

  if (elapsed < HOUR) {
    return { key: "admin.dashboard.age.minutes", count: Math.max(Math.round(elapsed / 60000), 1) };
  }
  if (elapsed < DAY) {
    return { key: "admin.dashboard.age.hours", count: Math.round(elapsed / HOUR) };
  }
  return { key: "admin.dashboard.age.days", count: Math.round(elapsed / DAY) };
}

/** Average handling time as a value + unit key, or null when there is no sample. */
export function durationLabel(seconds: number | null): AgeLabel | null {
  if (seconds == null) return null;
  if (seconds < 60 * 60) {
    return { key: "admin.dashboard.age.minutes", count: Math.max(Math.round(seconds / 60), 1) };
  }
  if (seconds < 48 * 60 * 60) {
    return { key: "admin.dashboard.age.hours", count: Math.round(seconds / 3600) };
  }
  return { key: "admin.dashboard.age.days", count: Math.round(seconds / 86400) };
}
