import { useTranslation } from "react-i18next";

import {
  OUTLINE_REGION_KEYS,
  REGION_FIELD,
  type TextField,
} from "@/lib/listings/text-placement";

/**
 * A reference map of the public detail page, top to bottom: which band is filled
 * by a text the broker writes, and which is generated from the structured
 * fields. Collapsed by default and drawn without any field chrome — the note
 * under each input already says where that text appears, so this is the diagram
 * you look at once, not on every visit.
 */
export function TextsOutline({ activeField }: { activeField?: TextField }) {
  const { t } = useTranslation();

  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer">{t("admin.listings.outline.title")}</summary>
      <ol className="mt-2 grid max-w-sm gap-px border-l border-border pl-3">
        {OUTLINE_REGION_KEYS.map((key) => {
          const field = REGION_FIELD[key];
          const active = !!field && field === activeField;
          return (
            <li
              key={key}
              className={`flex items-center gap-2 py-0.5 leading-tight ${
                field
                  ? active
                    ? "font-medium text-primary"
                    : "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  field ? "bg-primary" : "bg-border"
                }`}
              />
              <span>{t(`admin.listings.outline.regions.${key}`)}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 max-w-sm leading-relaxed">{t("admin.listings.outline.legend")}</p>
    </details>
  );
}
