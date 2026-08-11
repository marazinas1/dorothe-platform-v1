/** Resolve the best public URL for a listing image given its variants map. */
import type { ImageVariant } from "./media-paths";

type Variants = Record<string, { url?: string } | undefined> | null | undefined;

/** Fallback order per requested size — three variants only. */
const ORDER: Record<ImageVariant, ImageVariant[]> = {
  card: ["card", "detail", "og"],
  detail: ["detail", "card", "og"],
  og: ["og", "detail", "card"],
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
