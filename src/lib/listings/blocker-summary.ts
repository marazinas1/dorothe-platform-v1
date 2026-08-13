// One sentence naming what still keeps a listing from going live, in the
// interface language. Shared by the editor's status bar and the list controls.
import type { ChecklistItem } from "./publish-checklist";

type Translate = (key: string, vars?: Record<string, unknown>) => string;

export function blockerSummary(t: Translate, items: ChecklistItem[]): string {
  return items
    .map((item) =>
      item.missing?.length
        ? `${t(`admin.listings.checklist.items.${item.key}`)} (${item.missing
            .map((key) => t(`admin.listings.energyFields.${key}`))
            .join(", ")})`
        : t(`admin.listings.checklist.items.${item.key}`),
    )
    .join(" · ");
}
