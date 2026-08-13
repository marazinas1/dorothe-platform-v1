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
  textFields: listFrom("src/lib/listings/text-placement.ts", "TEXT_FIELDS"),
  outlineRegions: listFrom("src/lib/listings/text-placement.ts", "OUTLINE_REGION_KEYS"),
  statusGroups: listFrom("src/lib/listings/admin-list-groups.ts", "STATUS_GROUP_KEYS"),
  slugIssues: listFrom("src/lib/listings/slug.ts", "SLUG_ISSUE_KEYS"),
};

// prefix -> the enumeration whose values are appended to it at runtime.
const DYNAMIC_PREFIXES = {
  "listings.detail.sections": ENUMS.contentSections,
  "admin.listings.help": ENUMS.editableSections,
  "listings.status": ENUMS.statuses,
  "admin.listings.statusAction": ENUMS.statuses,
  "admin.role": ENUMS.roles,
  "admin.listings.checklist.items": ENUMS.checklist,
  "admin.listings.placement": ENUMS.textFields,
  "admin.listings.outline.regions": ENUMS.outlineRegions,
  "admin.listings.statusGroups": ENUMS.statusGroups,
  "admin.listings.errors": ENUMS.slugIssues,
};

/** Scope prefixes used by the label resolvers, read from source. */
const LABEL_PREFIXES = recordFrom("src/lib/listings/field-labels.ts", "PREFIX");

/**
 * Helper functions whose return value is handed straight to `t()`.
 * The keys are not listed by hand: they are expanded from the helper's own
 * `return` templates, so changing the helper to return a key that does not
 * exist fails this check.
 */
const HELPER_SOURCES = {
  moneyLabelKey: {
    file: "src/lib/listings/field-labels.ts",
    sets: { prefix: Object.values(LABEL_PREFIXES), field: ENUMS.moneyFields },
  },
  areaLabelKey: {
    file: "src/lib/listings/field-labels.ts",
    sets: {
      prefix: [LABEL_PREFIXES.admin],
      field: [...ENUMS.numericFields, "usable_area_commercial"],
    },
  },
};

/** Body of `function NAME(...)` up to the first column-0 closing brace. */
function functionBody(source, name) {
  const at = source.indexOf(`function ${name}(`);
  if (at < 0) fail(`cannot find function ${name}`);
  const close = source.indexOf("\n}", at);
  return source.slice(at, close < 0 ? source.length : close);
}

/** Every key a helper can return, expanded from its return templates. */
function helperKeys(name, { file, sets }) {
  const body = functionBody(readFileSync(file, "utf8"), name);
  const keys = [];
  for (const match of body.matchAll(/return\s+(`[^`]*`|"[^"]*")\s*;/g)) {
    const raw = match[1];
    if (raw.startsWith('"')) {
      keys.push(raw.slice(1, -1));
      continue;
    }
    let variants = [""];
    const template = raw.slice(1, -1);
    const parts = template.split(/(\$\{[^}]*\})/);
    for (const part of parts) {
      const placeholder = /^\$\{([^}]*)\}$/.exec(part);
      if (!placeholder) {
        variants = variants.map((v) => v + part);
        continue;
      }
      const expression = placeholder[1];
      const literals = [...expression.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
      const token = Object.keys(sets).find((key) =>
        new RegExp(`\\b${key}\\b`).test(expression),
      );
      const values = literals.length > 0 ? literals : token ? sets[token] : null;
      if (!values) {
        problems.push(`${file}: cannot expand \`${expression}\` in ${name}`);
        variants = [];
        break;
      }
      variants = variants.flatMap((v) => values.map((value) => v + value));
    }
    keys.push(...variants);
  }
  if (keys.length === 0) problems.push(`${file}: ${name} returns no resolvable key`);
  // A helper's generic return (`${prefix}.${field}`) also expands fields that an
  // earlier, more specific return handles with a suffix (price -> price_sale /
  // price_rent). Drop a key when a longer key extends it with a suffix.
  return keys.filter((key) => !keys.some((other) => other.startsWith(`${key}_`)));
}

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
  // src/lib/dashboard/age.ts — unit keys for "how long has this been waiting".
  "age.key": { prefix: "admin.dashboard.age" },
  "duration.key": { prefix: "admin.dashboard.age" },
  // src/components/admin/dashboard/QueueGroup.tsx — group title/empty state.
  titleKey: { prefix: "admin.dashboard.queue" },
  emptyKey: { prefix: "admin.dashboard.queue" },
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

    // 3. registered helper call
    const call = /^([A-Za-z_$][\w$]*)\s*\(/.exec(arg);
    if (call && HELPER_SOURCES[call[1]]) {
      for (const key of helperKeys(call[1], HELPER_SOURCES[call[1]])) requireKey(key, file);
      continue;
    }

    // 4. ternary (or ||) of key-shaped string literals only
    const literals = [...arg.matchAll(/"([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)"/g)].map((m) => m[1]);
    const skeleton = arg.replace(/"[^"]*"/g, "");
    if (literals.length > 0 && /^[^"`]*[?:|&][^"`]*$/.test(skeleton)) {
      for (const key of literals) requireKey(key, file, { objectOk });
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
