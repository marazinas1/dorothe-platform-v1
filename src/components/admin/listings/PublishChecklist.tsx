import { useTranslation } from "react-i18next";
import { Check, Minus } from "lucide-react";

import type { Checklist } from "@/lib/listings/publish-checklist";

/**
 * Persistent, neutral publish checklist. A draft may be incomplete, so nothing
 * here is an error — it simply states what publishing still needs. The checklist
 * is built once by the form, so the publish button and this list can never
 * disagree.
 */
export function PublishChecklist({ checklist }: { checklist: Checklist }) {
  const { t } = useTranslation();
  const { items, outstanding, ready, energyExempt } = checklist;

  return (
    <section className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base">{t("admin.listings.checklist.title")}</h2>
        <p className="text-xs text-muted-foreground">
          {ready
            ? t("admin.listings.checklist.ready")
            : t("admin.listings.checklist.remaining", { count: outstanding })}
        </p>
      </div>

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-2 text-sm">
            {item.done ? (
              <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
            ) : (
              <Minus className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
            )}
            <span className={item.done ? "text-muted-foreground" : "text-foreground"}>
              {t(`admin.listings.checklist.items.${item.key}`)}
              {!item.done && item.missing?.length
                ? `: ${item.missing
                    .map((key) => t(`admin.listings.energyFields.${key}`))
                    .join(", ")}`
                : null}
            </span>
          </li>
        ))}
      </ul>

      {energyExempt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("admin.listings.checklist.energyExempt")}
        </p>
      ) : null}
    </section>
  );
}
