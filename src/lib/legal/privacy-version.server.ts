import { legalText } from "./documents";
import type { SiteSettings } from "@/types/site-settings";

/**
 * Fingerprint of the privacy notice a visitor was shown, stored next to the
 * consent timestamp. GDPR Art. 5(2) requires being able to demonstrate what
 * was consented to, so a short content hash of the exact text is recorded.
 */
export async function privacyVersion(
  settings: SiteSettings,
  locale: string,
): Promise<string> {
  const text = legalText(settings, "privacy", locale);
  if (!text) return `${locale}:empty`;
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${locale}:${hex.slice(0, 16)}`;
}
