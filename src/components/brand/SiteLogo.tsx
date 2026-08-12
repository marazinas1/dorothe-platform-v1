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
 * falls back to the typographic BrandMark. The file is shown in its own
 * colours; a client that needs a light variant over photography uploads it as
 * logo_dark_url.
 */
export function SiteLogo({ settings, tone = "dark", className, size = "md" }: Props) {
  const src = tone === "light" ? (settings.logo_dark_url ?? settings.logo_url) : settings.logo_url;
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
