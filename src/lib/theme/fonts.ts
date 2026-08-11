/**
 * Curated font registry (core).
 *
 * A clone picks heading/body families from this list through site_settings;
 * nothing about a client's typography lives in CSS. Every family here is
 * self-hosted via @fontsource and imported once in src/styles.css — the
 * browser only downloads the files a rendered glyph actually needs, so
 * unused families cost nothing at runtime.
 *
 * Keep the list small (4-6 families). Adding a family means: install the
 * @fontsource package, import it in styles.css, add the entry here.
 * All families must ship the `latin-ext` subset (German umlauts, ß).
 */

export type FontRole = "heading" | "body";

export interface FontFamily {
  /** Stable key stored in site_settings.font_heading / font_body. */
  key: string;
  label: string;
  /** Full CSS font stack, including fallbacks. */
  stack: string;
  roles: FontRole[];
}

export const FONT_REGISTRY: FontFamily[] = [
  {
    key: "fraunces",
    label: "Fraunces",
    stack: '"Fraunces Variable", Georgia, serif',
    roles: ["heading"],
  },
  {
    key: "playfair-display",
    label: "Playfair Display",
    stack: '"Playfair Display Variable", Georgia, serif',
    roles: ["heading"],
  },
  {
    key: "lora",
    label: "Lora",
    stack: '"Lora Variable", Georgia, serif',
    roles: ["heading", "body"],
  },
  {
    key: "inter",
    label: "Inter",
    stack: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
    roles: ["heading", "body"],
  },
  {
    key: "work-sans",
    label: "Work Sans",
    stack: '"Work Sans Variable", ui-sans-serif, system-ui, sans-serif',
    roles: ["heading", "body"],
  },
  {
    key: "dm-sans",
    label: "DM Sans",
    stack: '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
    roles: ["heading", "body"],
  },
];

export function fontsForRole(role: FontRole): FontFamily[] {
  return FONT_REGISTRY.filter((f) => f.roles.includes(role));
}

/**
 * Turn a stored setting into a CSS font stack. Registry keys resolve to their
 * stack; anything else is passed through unchanged so an existing install that
 * stored a raw stack keeps working.
 */
export function resolveFontStack(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const hit = FONT_REGISTRY.find((f) => f.key === trimmed);
  return hit ? hit.stack : trimmed;
}

/** Reverse lookup for the admin select: key, or "" when the value is custom. */
export function fontKeyForValue(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const hit = FONT_REGISTRY.find((f) => f.key === trimmed || f.stack === trimmed);
  return hit ? hit.key : "";
}
