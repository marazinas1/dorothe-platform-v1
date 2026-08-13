import { BrandMark } from "@/components/brand/BrandMark";
import { logoSrc, type LogoVariant } from "@/lib/theme/logo";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  settings: SiteSettings;
  /** `light` is for use over hero photography. */
  tone?: "dark" | "light";
  className?: string;
  /** Rendered height of the logo image. */
  size?: "sm" | "md";
  /**
   * `mono` is the one-colour header mark, `original` the supplied file. Both
   * come from src/assets/brand via @/lib/theme/logo.
   */
  variant?: LogoVariant;
};

/**
 * Renders the brand mark, falling back to site_settings.logo_url and then to
 * the typographic BrandMark. A client that needs a light variant over
 * photography uploads it as logo_dark_url.
 */
export function SiteLogo({
  settings,
  tone = "dark",
  className,
  size = "md",
  variant = "original",
}: Props) {
  const fallback =
    tone === "light" ? (settings.logo_dark_url ?? settings.logo_url) : settings.logo_url;
  const src = tone === "light" ? fallback : logoSrc(variant, fallback);
  if (!src) return <BrandMark settings={settings} tone={tone} className={className} />;

  return (
    <img
      src={src}
      alt={settings.site_name}
      className={cn(
        size === "sm" ? "h-12 md:h-14" : "h-16 md:h-20",
        "w-auto object-contain transition-[height] duration-500 ease-out",
        className,
      )}
      loading="eager"
      decoding="async"
    />
  );
}
