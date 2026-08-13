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

export type SlugIssue = "empty" | "reserved" | "normalized";

export function slugIssue(raw: string, enabledLocales: string[]): SlugIssue | null {
  const value = (raw ?? "").trim();
  const normalized = slugifyText(value);
  if (normalized === "") return "empty";
  if (RESERVED.includes(normalized) || enabledLocales.includes(normalized)) return "reserved";
  if (normalized !== value) return "normalized";
  return null;
}

/** Public path of a listing, used for the URL preview in the admin. */
export function listingPath(locale: string, slug: string): string {
  return `/${locale}/immobilien/${slug}`;
}
