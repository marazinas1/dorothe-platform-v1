import { pickLocalized } from "@/lib/listings/format";
import type { SiteSettings } from "@/types/site-settings";

/**
 * The credentials on the homepage used to be stated twice: a row of large
 * institution names (site_settings.credibility_stats) followed by a list of
 * qualifications naming the same institutions again. The duplication is
 * structural, not textual — the same information in two formats.
 *
 * The rule below merges them instead of deleting either side. The institution
 * is the label; the qualification is the substance, so each institution is
 * named once and carries what it certifies. It works on whatever a client puts
 * in settings and degrades in both directions: an institution with no
 * qualification still states what it is, and a qualification that belongs to no
 * listed institution renders alongside rather than disappearing.
 */

export interface CredentialGroup {
  /** Short institution name, e.g. the certifying body. */
  institution: string;
  /** Localized description of what that institution certifies. */
  description: string;
  /** Qualifications issued by this institution. May be empty. */
  items: string[];
}

export interface CredentialsBlock {
  groups: CredentialGroup[];
  /** Qualifications that match no listed institution. */
  other: string[];
  /** Client heading, or null when the client has not set one. */
  heading: string | null;
  hasContent: boolean;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9äöüß]+/g, " ").trim();
}

/** A qualification belongs to an institution when it names it, or restates it. */
function matches(qualification: string, institution: string, description: string): boolean {
  const q = normalize(qualification);
  const inst = normalize(institution);
  if (inst.length > 1 && new RegExp(`(^| )${inst}( |$)`).test(q)) return true;
  const desc = normalize(description);
  return desc.length > 8 && (q === desc || q.includes(desc) || desc.includes(q));
}

export function buildCredentials(
  settings: SiteSettings,
  locale: string,
): CredentialsBlock {
  const stats = settings.credibility_stats ?? [];
  const qualifications = (settings.qualifications ?? [])
    .map((q) => (typeof q === "string" ? q.trim() : ""))
    .filter(Boolean);

  const taken = new Set<number>();
  const groups: CredentialGroup[] = stats.map((stat) => {
    const description =
      pickLocalized(stat.label, locale, settings.default_locale) ?? "";
    const items: string[] = [];
    qualifications.forEach((qualification, index) => {
      if (taken.has(index)) return;
      if (!matches(qualification, stat.value, description)) return;
      taken.add(index);
      items.push(qualification);
    });
    return { institution: stat.value, description, items };
  });

  const other = qualifications.filter((_, index) => !taken.has(index));
  const heading =
    pickLocalized(settings.credibility_heading, locale, settings.default_locale) || null;

  return {
    groups,
    other,
    heading,
    hasContent: groups.length > 0 || other.length > 0,
  };
}
