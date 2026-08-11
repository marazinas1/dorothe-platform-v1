import type { Locale } from "@/i18n/config";

/** Pick localized string from a jsonb {de,en,...} column, falling back gracefully. */
export function pickLocalized(
  value: unknown,
  locale: string,
  fallbackLocale = "de",
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const primary = obj[locale];
    if (typeof primary === "string" && primary.length > 0) return primary;
    const fb = obj[fallbackLocale];
    if (typeof fb === "string" && fb.length > 0) return fb;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return "";
}

/** Format a price for display; returns null when it should be hidden. */
export function formatPrice(
  price: number | null | undefined,
  currency: string,
  locale: Locale,
  opts: {
    onRequest?: boolean | null;
    period?: string | null;
    onRequestLabel: string;
  },
): string {
  if (opts.onRequest) return opts.onRequestLabel;
  if (price == null) return opts.onRequestLabel;
  // German convention places the symbol after the amount: "489.000 €".
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  });
  const base = nf.format(price);
  if (opts.period === "month") return `${base}/${locale === "en" ? "month" : "Monat"}`;
  return base;
}

export function formatArea(
  area: number | null | undefined,
  unit: "sqm" | "sqft",
  locale: Locale,
): string {
  if (area == null) return "—";
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    maximumFractionDigits: 0,
  });
  const suffix = unit === "sqft" ? "ft²" : "m²";
  return `${nf.format(area)} ${suffix}`;
}

export function formatRooms(rooms: number | null | undefined, locale: Locale): string {
  if (rooms == null) return "—";
  const label = locale === "en" ? (rooms === 1 ? "room" : "rooms") : "Zimmer";
  return `${rooms} ${label}`;
}

export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "de-AT", {
    year: "numeric",
    month: "short",
  });
}

/** Currency symbol for input prefixes — never a hardcoded sign. */
export function currencySymbol(currency: string, locale: Locale = "de"): string {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}
