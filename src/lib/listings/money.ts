// Money input formatting: grouped digits while typing, a plain number in state.
// Kept out of the components so every money field behaves identically.

/** Digits and separators the user may type, per locale. */
function groupFormatter(locale: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
}

/**
 * Turn what the user typed into a number. Grouping separators are dropped and a
 * decimal comma is accepted, because a German broker types "1.250,50".
 */
export function parseMoneyInput(raw: string, locale: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (cleaned.trim() === "") return null;

  const german = !locale.startsWith("en");
  const normalized = german
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned.replace(/,/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Display value for a money input: grouped, and never fighting the caret. */
export function formatMoneyInput(
  value: number | null | undefined,
  raw: string,
  locale: string,
): string {
  // While the user is mid-entry (trailing separator) keep their own text.
  if (/[.,]\d*$/.test(raw) && raw.length > 0) return raw;
  if (value == null) return "";
  return groupFormatter(locale).format(value);
}
