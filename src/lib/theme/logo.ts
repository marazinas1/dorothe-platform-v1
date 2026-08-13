import logoOriginal from "@/assets/brand/logo.png.asset.json";
import logoMono from "@/assets/brand/logo-mono.png.asset.json";

export type LogoVariant = "mono" | "original";

/**
 * Logo sources for the two places a mark appears: a one-colour version in the
 * header, where it must not compete with the page, and the supplied original
 * lower down. Both files live in src/assets/brand, so a clone swaps the files
 * and changes nothing in code. A clone that ships no asset falls back to
 * site_settings.logo_url.
 */
const FILES: Record<LogoVariant, string> = {
  original: logoOriginal.url,
  mono: logoMono.url,
};

export function logoSrc(variant: LogoVariant, fallback: string | null): string | null {
  return FILES[variant] ?? fallback ?? null;
}
