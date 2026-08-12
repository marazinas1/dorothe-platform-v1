// Build-time translation key check.
//
// It exists because of a real bug class: a key composed at runtime from a
// constant (`t(`admin.listings.help.${key}`)` over EDITABLE_CONTENT_SECTIONS)
// was missing, and nothing caught it. So the check resolves dynamic keys
// against the constants that produce them, not just literal keys.
//
// The rule now has no blind spot: EVERY `t(...)` call must be resolvable.
// A call whose first argument is not a string literal, a recognised template
// literal, a ternary of literals, a registered helper call or a registered
// identifier fails the check. Register new shapes in HELPERS / IDENTIFIERS
// below — the registry lists the exact set of keys the expression can return,
// and every one of them is verified against every message file.
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
  moneyFields: unionFrom("src/lib/listings/field-labels.ts", "MoneyField"),
  numericFields: unionFrom("src/components/admin/listings/NumberFields.tsx", "NumericKey"),
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

/** Scope prefixes used by the label resolvers, read from source. */
const LABEL_PREFIXES = recordFrom("src/lib/listings/field-labels.ts", "PREFIX");

/**
 * Helper functions whose return value is handed straight to `t()`.
 * Each entry lists every key the helper can produce.
 */
const HELPERS = {
  moneyLabelKey: Object.values(LABEL_PREFIXES).flatMap((prefix) =>
    ENUMS.moneyFields.flatMap((field) =>
      field === "price"
        ? [`${prefix}.price_sale`, `${prefix}.price_rent`]
        : [`${prefix}.${field}`],
    ),
  ),
  areaLabelKey: [
    ...ENUMS.numericFields.map((field) => `${LABEL_PREFIXES.admin}.${field}`),
    `${LABEL_PREFIXES.admin}.usable_area_commercial`,
  ],
};

/**
 * Identifiers / member expressions passed to `t()`, with the keys they hold.
 * `prefix` means: the whole namespace must exist with identical keys in every
 * locale (used where the code falls back to the raw key on a miss).
 */
const IDENTIFIERS = {
  // src/lib/listings/publish-error.ts — names the fields the database named.
  key: { prefix: "admin.listings.energyFields" },
  // src/components/admin/listings/CommissionFields.tsx
  freeKey: {
    keys: [
      "admin.listings.fields.commission_free",
      "admin.listings.fields.commission_free_rent",
    ],
  },
  // src/components/admin/settings/LegalTab.tsx
  "f.labelKey": { prefix: "admin.settings.legal" },
};

function listFrom(file, name) {
  const source = readFileSync(file, "utf8");
  const match = new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`, "s").exec(source);
  if (!match) fail(`cannot read ${name} from ${file}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function unionFrom(file, name) {
  const source = readFileSync(file, "utf8");
  const match = new RegExp(`type ${name}[^=]*=\\s*([^;]+);`, "s").exec(source);
  if (!match) fail(`cannot read type ${name} from ${file}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function recordFrom(file, name) {
  const source = readFileSync(file, "utf8");
  const match = new RegExp(`${name}[^=]*=\\s*\\{([^}]*)\\}`, "s").exec(source);
  if (!match) fail(`cannot read ${name} from ${file}`);
  return Object.fromEntries(
    [...match[1].matchAll(/(\w+)\s*:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
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

function requireKey(key, where, { objectOk = false } = {}) {
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

/** Read the balanced argument list of a call starting at `open` (the "("). */
function readArgs(source, open) {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if ("([{`".includes(char)) depth += 1;
    else if (")]}".includes(char)) {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return null;
}

/** First argument of an argument list, split at top-level commas. */
function firstArg(args) {
  let depth = 0;
  for (let i = 0; i < args.length; i += 1) {
    const char = args[i];
    if ("([{`".includes(char)) depth += 1;
    else if (")]}".includes(char)) depth -= 1;
    else if (char === "," && depth === 0) return args.slice(0, i).trim();
  }
  return args.trim();
}

const T_CALL = /(?<![A-Za-z0-9_$.])t\s*\(/g;

for (const file of walk("src")) {
  if (file.startsWith("src/messages")) continue;
  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(T_CALL)) {
    const open = match.index + match[0].length - 1;
    const args = readArgs(source, open);
    if (args === null) continue;
    const arg = firstArg(args).replace(/\s+/g, " ");
    const objectOk = /returnObjects/.test(args);

    // 1. plain string literal
    const literal = /^"([A-Za-z0-9_.]+)"$/.exec(arg);
    if (literal) {
      requireKey(literal[1], file, { objectOk });
      continue;
    }

    // 2. template literal with a known/parity-checked prefix
    const template = /^`([A-Za-z0-9_.]+)\.\$\{/.exec(arg);
    if (template) {
      const prefix = template[1];
      const values = DYNAMIC_PREFIXES[prefix];
      if (!values) requireParity(prefix, file);
      else for (const value of values) requireKey(`${prefix}.${value}`, file);
      continue;
    }

    // 3. ternary (or ||) of string literals only
    const literals = [...arg.matchAll(/"([A-Za-z0-9_.]+)"/g)].map((m) => m[1]);
    const withoutLiterals = arg.replace(/"[^"]*"/g, "");
    if (literals.length > 0 && /^[^"`]*[?:|&][^"`]*$/.test(withoutLiterals)) {
      for (const key of literals) requireKey(key, file, { objectOk });
      continue;
    }

    // 4. registered helper call
    const call = /^([A-Za-z_$][\w$]*)\s*\(/.exec(arg);
    if (call && HELPERS[call[1]]) {
      for (const key of HELPERS[call[1]]) requireKey(key, file);
      continue;
    }

    // 5. registered identifier / member expression
    const registered = IDENTIFIERS[arg];
    if (registered) {
      if (registered.prefix) requireParity(registered.prefix, file);
      else for (const key of registered.keys) requireKey(key, file);
      continue;
    }

    problems.push(
      `${file}: t(${arg}) is not statically resolvable — register the expression ` +
        `in HELPERS or IDENTIFIERS in scripts/check-i18n-keys.mjs`,
    );
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
console.log("i18n check: every t() call resolves to keys present in de and en.");
