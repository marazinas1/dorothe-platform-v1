// Client-safe mirror of public.slugify and the manual-slug rules the database
// enforces. Kept in /lib so the admin form can warn before a round trip; the
// database stays the authority.

const TRANSLITERATE: Array<[RegExp, string]> = [
  [/ä/g, "ae"],
  [/ö/g, "oe"],
  [/ü/g, "ue"],
  [/ß/g, "ss"],
  [/æ/g, "ae"],
  [/ø/g, "oe"],
  [/œ/g, "oe"],
];

const PLAIN = "aaaaaceeeeiiiinoooouuuyy";
const ACCENTED = "áàâãåçéèêëíìîïñóòôõúùûýÿ";

/** Same output as public.slugify(text): lowercase, ASCII, hyphen separated. */
export function slugifyText(input: string): string {
  let s = (input ?? "").toLowerCase();
  for (const [pattern, replacement] of TRANSLITERATE) s = s.replace(pattern, replacement);
  s = [...s].map((ch) => {
    const at = ACCENTED.indexOf(ch);
    return at === -1 ? ch : PLAIN[at];
  }).join("");
  s = s.replace(/[^a-z0-9]+/g, "-");
  return s.replace(/^-+|-+$/g, "");
}

/** Slugs that would shadow a locale prefix or a reserved path segment. */
const RESERVED = ["de", "en", "preview", "api", "admin"];

/** Message keys under admin.listings.errors, one per rejection reason. */
export const SLUG_ISSUE_KEYS = [
  "slug_empty",
  "slug_reserved",
  "slug_normalized",
  "slug_taken",
  "slug_invalid",
] as const;

export type SlugIssueKey = (typeof SLUG_ISSUE_KEYS)[number];

export function slugIssue(raw: string, enabledLocales: string[]): SlugIssueKey | null {
  const value = (raw ?? "").trim();
  const normalized = slugifyText(value);
  if (normalized === "") return "slug_empty";
  if (RESERVED.includes(normalized) || enabledLocales.includes(normalized)) {
    return "slug_reserved";
  }
  if (normalized !== value) return "slug_normalized";
  return null;
}

/** Public path of a listing, used for the URL preview in the admin. */
export function listingPath(locale: string, slug: string): string {
  return `/${locale}/immobilien/${slug}`;
}
