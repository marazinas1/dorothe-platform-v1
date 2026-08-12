import { useTranslation } from "react-i18next";

import {
  OUTLINE_REGION_KEYS,
  REGION_FIELD,
  type TextField,
} from "@/lib/listings/text-placement";

/**
 * A deliberately plain outline of the public detail page: one stacked band per
 * region, top to bottom, with the four written fields marked. Not a preview —
 * just a map, so a broker can see which text fills which part of the page.
 */
export function TextsOutline({ activeField }: { activeField?: TextField }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {t("admin.listings.outline.title")}
      </p>
      <ul className="mt-2 grid gap-1">
        {OUTLINE_REGION_KEYS.map((key) => {
          const field = REGION_FIELD[key];
          const active = !!field && field === activeField;
          return (
            <li
              key={key}
              className={`rounded-sm border px-2 py-1.5 text-xs ${
                field
                  ? active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground"
                  : "border-dashed border-border bg-transparent text-muted-foreground"
              }`}
            >
              {t(`admin.listings.outline.regions.${key}`)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
