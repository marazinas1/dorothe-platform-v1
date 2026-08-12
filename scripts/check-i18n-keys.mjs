// Build-time translation key check.
//
// It exists because of a real bug class: a key composed at runtime from a
// constant (`t(`admin.listings.help.${key}`)` over EDITABLE_CONTENT_SECTIONS)
// was missing, and nothing caught it. So the check resolves dynamic keys
// against the constants that produce them, not just literal keys.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MESSAGES = ["de", "en"];
const dicts = Object.fromEntries(
  MESSAGES.map((locale) => [
    locale,
    JSON.parse(readFileSync(`src/messages/${locale}.json`, "utf8")),
  ]),
);

/** Enumerations that produce dynamic translation keys, read from source. */
const ENUMS = {
  contentSections: listFrom("src/lib/listings/admin-schema.ts", "CONTENT_SECTION_KEYS"),
  editableSections: listFrom("src/lib/listings/admin-schema.ts", "EDITABLE_CONTENT_SECTIONS"),
  statuses: listFrom("src/lib/listings/admin-schema.ts", "LISTING_STATUSES"),
  roles: listFrom("src/lib/auth/permissions.ts", "ROLES"),
  checklist: unionFrom("src/lib/listings/publish-checklist.ts", "ChecklistKey"),
};

// prefix -> the enumeration whose values are appended to it at runtime.
const DYNAMIC_PREFIXES = {
  "listings.detail.sections": ENUMS.contentSections,
  "admin.listings.help": ENUMS.editableSections,
  "listings.status": ENUMS.statuses,
  "admin.listings.statusAction": ENUMS.statuses,
  "admin.role": ENUMS.roles,
  "admin.listings.checklist.items": ENUMS.checklist,
};

function listFrom(file, name) {
  const source = readFileSync(file, "utf8");
  const match = new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`, "s").exec(source);
  if (!match) fail(`cannot read ${name} from ${file}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function unionFrom(file, name) {
  const source = readFileSync(file, "utf8");
  const match = new RegExp(`type ${name}\\s*=\\s*([^;]+);`, "s").exec(source);
  if (!match) fail(`cannot read type ${name} from ${file}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function lookup(dict, key) {
  let node = dict;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object" || !(part in node)) return undefined;
    node = node[part];
  }
  return node;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(ts|tsx)$/.test(path) && !path.endsWith(".gen.ts")) files.push(path);
  }
  return files;
}

const problems = [];

function require(key, where, { objectOk = false } = {}) {
  for (const locale of MESSAGES) {
    const value = lookup(dicts[locale], key);
    if (value === undefined) {
      problems.push(`${where}: missing ${locale} key "${key}"`);
    } else if (typeof value !== "string" && !objectOk) {
      problems.push(`${where}: key "${key}" resolves to a group, not a string (${locale})`);
    }
  }
}

/** Namespaces must exist in every locale with the same keys. */
function requireParity(prefix, where) {
  const nodes = MESSAGES.map((locale) => lookup(dicts[locale], prefix));
  if (nodes.some((node) => !node || typeof node !== "object")) {
    problems.push(`${where}: dynamic key prefix "${prefix}" is not a group in every locale`);
    return;
  }
  const [first, ...rest] = nodes.map((node) => Object.keys(node).sort().join(","));
  for (const [index, keys] of rest.entries()) {
    if (keys !== first) {
      problems.push(
        `${where}: "${prefix}" differs between ${MESSAGES[0]} and ${MESSAGES[index + 1]}`,
      );
    }
  }
}

for (const file of walk("src")) {
  if (file.startsWith("src/messages")) continue;
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(/\bt\(\s*"([a-zA-Z0-9_.]+)"/g)) {
    // returnObjects deliberately reads a list/group of strings.
    const tail = source.slice(match.index, match.index + 220);
    require(match[1], file, { objectOk: /returnObjects/.test(tail) });
  }

  // Dynamic keys: t(`prefix.${expr}`)
  for (const match of source.matchAll(/\bt\(\s*`([a-zA-Z0-9_.]+)\.\$\{/g)) {
    const prefix = match[1];
    const values = DYNAMIC_PREFIXES[prefix];
    if (!values) {
      // Not a known enumeration: at least require the namespace to exist and
      // to hold the same keys in every locale.
      requireParity(prefix, file);
      continue;
    }
    for (const value of values) require(`${prefix}.${value}`, file);
  }
}

function fail(message) {
  console.error(`i18n check: ${message}`);
  process.exit(1);
}

if (problems.length > 0) {
  console.error(`i18n check failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log("i18n check: all translation keys resolve in de and en.");
