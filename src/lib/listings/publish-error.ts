// Raw Postgres/trigger messages are not user-facing copy. The database stays the
// authority on whether a publish is allowed; this turns its message into a
// sentence in the user's interface language, naming the fields it named.
export type PublishErrorInfo =
  | { kind: "energy"; fields: string[] }
  | { kind: "permission" }
  | { kind: "transition" }
  | { kind: "raw"; message: string };

const ENERGY_RE = /missing or invalid energy fields[^:]*:\s*(.+)$/i;

export function parsePublishError(message: string): PublishErrorInfo {
  const energy = ENERGY_RE.exec(message.trim());
  if (energy) {
    const fields = energy[1]
      .split(/[,;]\s*/)
      .map((field) => field.trim())
      .filter(Boolean);
    return { kind: "energy", fields };
  }
  if (/permission denied|not permitted|insufficient/i.test(message)) {
    return { kind: "permission" };
  }
  if (/invalid status|status flow|transition/i.test(message)) {
    return { kind: "transition" };
  }
  return { kind: "raw", message };
}

type Translate = (key: string, vars?: Record<string, unknown>) => string;

/** Human sentence for a failed status change, in the interface language. */
export function formatPublishError(t: Translate, message: string): string {
  const info = parsePublishError(message);
  switch (info.kind) {
    case "energy": {
      const names = info.fields.map((field) => {
        const key = `admin.listings.energyFields.${field}`;
        const label = t(key);
        return label === key ? field : label;
      });
      return t("admin.listings.publishNeedsEnergy", { fields: names.join(", ") });
    }
    case "permission":
      return t("admin.listings.errors.permission");
    case "transition":
      return t("admin.listings.errors.transition");
    default:
      return t("admin.listings.errors.generic");
  }
}
