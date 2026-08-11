/** Resolve the best public URL for a listing image given its variants map. */
import type { ImageVariant } from "./media-paths";

type Variants = Record<string, { url?: string } | undefined> | null | undefined;

/**
 * Fallback order per requested size. The pipeline writes card/detail/og;
 * the legacy keys keep older rows (and seeded demo data) rendering.
 */
const ORDER: Record<ImageVariant, string[]> = {
  card: ["card", "detail", "og", "medium", "thumb", "large"],
  detail: ["detail", "card", "og", "large", "medium", "thumb"],
  og: ["og", "detail", "card", "large", "medium", "thumb"],
};

export function pickImageUrl(
  variants: unknown,
  size: ImageVariant = "card",
): string | null {
  if (!variants || typeof variants !== "object") return null;
  const v = variants as Variants;
  for (const key of ORDER[size]) {
    const url = v?.[key]?.url;
    if (typeof url === "string" && url.length > 0) return url;
  }
  return null;
}
