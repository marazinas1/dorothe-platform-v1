import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Minus } from "lucide-react";

import type { Checklist, ChecklistItem } from "@/lib/listings/publish-checklist";
import { scrollToField } from "@/lib/listings/scroll-to-field";

/**
 * The publish checklist doubles as the form's navigation: every outstanding item
 * is a button that opens the section it lives in, scrolls to the exact field and
 * focuses it. Sticky on desktop, collapsed into a summary on mobile so it never
 * eats the screen while typing.
 */
export function ChecklistRail({ checklist }: { checklist: Checklist }) {
  const { t } = useTranslation();
  const { items, outstanding, ready, energyExempt } = checklist;

  const body = (
    <>
      <p className="text-xs text-muted-foreground">
        {ready
          ? t("admin.listings.checklist.ready")
          : t("admin.listings.checklist.remaining", { count: outstanding })}
      </p>
      <ul className="mt-3 grid gap-1">
        {items.map((item) => (
          <li key={item.key}>
            <ChecklistRow item={item} label={labelFor(item, t)} />
          </li>
        ))}
      </ul>
      {energyExempt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("admin.listings.checklist.energyExempt")}
        </p>
      ) : null}
    </>
  );

  return (
    <>
      {/* Mobile: one collapsed line that says how much is left. */}
      <details className="rounded-lg border border-border bg-muted/30 p-4 lg:hidden">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <ChevronDown className="h-4 w-4" aria-hidden />
          {t("admin.listings.checklist.title")}
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {ready
              ? t("admin.listings.checklist.ready")
              : t("admin.listings.checklist.remaining", { count: outstanding })}
          </span>
        </summary>
        <div className="mt-3">{body}</div>
      </details>

      <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start lg:rounded-lg lg:border lg:border-border lg:bg-muted/30 lg:p-4">
        <h2 className="font-heading text-base">{t("admin.listings.checklist.title")}</h2>
        {body}
      </aside>
    </>
  );
}

function labelFor(item: ChecklistItem, t: (key: string) => string): string {
  const base = t(`admin.listings.checklist.items.${item.key}`);
  if (item.done || !item.missing?.length) return base;
  const names = item.missing.map((key) => t(`admin.listings.energyFields.${key}`)).join(", ");
  return `${base}: ${names}`;
}

function ChecklistRow({ item, label }: { item: ChecklistItem; label: string }) {
  return (
    <button
      type="button"
      onClick={() => scrollToField(item.anchor)}
      className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-muted"
    >
      {item.done ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      ) : (
        <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className={item.done ? "text-muted-foreground" : "text-foreground"}>{label}</span>
    </button>
  );
}
