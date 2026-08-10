import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  settings: SiteSettings;
  /** `light` is for use over hero photography. */
  tone?: "dark" | "light";
  className?: string;
  /** Rendered height of the logo image. */
  size?: "sm" | "md";
};

/**
 * Renders site_settings.logo_url when a client has uploaded a logo, otherwise
 * falls back to the typographic BrandMark. The uploaded file is displayed
 * neutralised (desaturated + tinted toward ink) so a client logo in foreign
 * brand colours does not fight the current palette; the stored file itself is
 * untouched, so removing the treatment later is a one-line change.
 */
export function SiteLogo({ settings, tone = "dark", className, size = "md" }: Props) {
  const src = tone === "light" ? (settings.logo_dark_url ?? settings.logo_url) : settings.logo_url;
  if (!src) return <BrandMark settings={settings} tone={tone} className={className} />;

  return (
    <img
      src={src}
      alt={settings.site_name}
      className={cn(
        size === "sm" ? "h-8" : "h-10 md:h-12",
        "w-auto object-contain",
        // Neutralising display treatment — no palette clash while the brand
        // decision is still open.
        tone === "light"
          ? "opacity-90 brightness-0 invert"
          : "opacity-80 grayscale contrast-[1.05] brightness-[0.55]",
        className,
      )}
      loading="eager"
      decoding="async"
    />
  );
}
