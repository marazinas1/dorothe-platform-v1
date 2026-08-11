/**
 * Design token engine (core).
 *
 * ONE design system for the whole platform: the public site and the admin
 * panel read the same tokens. Everything a clone may change — surface and text
 * colours, accent, fonts, corner radii, button shape — is a value in
 * site_settings and is emitted here as CSS custom properties on :root.
 * Nothing about a client's look lives in CSS or in components.
 *
 * The admin's only allowed difference is a denser type/spacing scale
 * (`.admin-density` in src/styles.css) — a scale, not a second theme.
 */

import { resolveFontStack } from "./fonts";
import type { SiteSettings } from "@/types/site-settings";

/** Corner radius scale keys stored in site_settings.radius_scale. */
export const RADIUS_SCALES = {
  sharp: { base: "0.125rem", media: "0.25rem" },
  soft: { base: "0.5rem", media: "0.875rem" },
  rounded: { base: "0.875rem", media: "1.25rem" },
} as const;

export type RadiusScaleKey = keyof typeof RADIUS_SCALES;

/** Button shape keys stored in site_settings.button_style. */
export const BUTTON_STYLES = {
  square: "0.125rem",
  rounded: "var(--radius)",
  pill: "9999px",
} as const;

export type ButtonStyleKey = keyof typeof BUTTON_STYLES;

export const DEFAULT_RADIUS_SCALE: RadiusScaleKey = "soft";
export const DEFAULT_BUTTON_STYLE: ButtonStyleKey = "rounded";

export function radiusScaleKey(value: string | null | undefined): RadiusScaleKey {
  return value && value in RADIUS_SCALES ? (value as RadiusScaleKey) : DEFAULT_RADIUS_SCALE;
}

export function buttonStyleKey(value: string | null | undefined): ButtonStyleKey {
  return value && value in BUTTON_STYLES ? (value as ButtonStyleKey) : DEFAULT_BUTTON_STYLE;
}

type Rule = [string, string | null | undefined];

/**
 * Builds the `:root { … }` declaration list from site_settings. Derived tokens
 * (card, popover, input, sidebar, ring) follow their source token so a clone
 * only ever sets the handful of values above.
 */
export function buildThemeVariables(settings: SiteSettings): string {
  const heading = resolveFontStack(settings.font_heading);
  const body = resolveFontStack(settings.font_body);
  const radius = RADIUS_SCALES[radiusScaleKey(settings.radius_scale)];
  const button = BUTTON_STYLES[buttonStyleKey(settings.button_style)];

  const rules: Rule[] = [
    ["--primary", settings.primary_color],
    ["--ring", settings.primary_color],
    ["--sidebar-primary", settings.primary_color],
    ["--sidebar-ring", settings.primary_color],
    ["--secondary", settings.secondary_color],
    ["--muted", settings.secondary_color],
    ["--sidebar-accent", settings.secondary_color],
    ["--accent", settings.accent_color],
    ["--background", settings.background_color],
    ["--card", settings.surface_color],
    ["--popover", settings.surface_color],
    ["--sidebar", settings.surface_color],
    ["--foreground", settings.text_color],
    ["--card-foreground", settings.text_color],
    ["--popover-foreground", settings.text_color],
    ["--secondary-foreground", settings.text_color],
    ["--accent-foreground", settings.text_color],
    ["--sidebar-foreground", settings.text_color],
    ["--sidebar-accent-foreground", settings.text_color],
    ["--muted-foreground", settings.muted_text_color],
    ["--border", settings.border_color],
    ["--input", settings.border_color],
    ["--sidebar-border", settings.border_color],
    ["--font-heading", heading],
    ["--font-body", body],
    ["--radius", radius.base],
    ["--radius-media", radius.media],
    ["--radius-button", button],
  ];

  return rules
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}: ${value};`)
    .join("");
}
