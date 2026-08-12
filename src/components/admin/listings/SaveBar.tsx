import { useTranslation } from "react-i18next";
import { Check, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AutosaveState } from "./use-listing-autosave";

/**
 * Sticky bar at the bottom of the listing form: autosave status on the left,
 * the explicit save action on the right. Uses the shared tokens, only denser.
 */
export function SaveBar({
  dirty,
  saving,
  autosave,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  autosave: AutosaveState;
  onSave: () => void;
}) {
  const { t, i18n } = useTranslation();

  // The autosave timestamp is operator feedback, not listing content, so it
  // correctly follows the interface language.
  const time = autosave.at
    ? new Intl.DateTimeFormat(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(autosave.at)
    : "";

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {autosave.status === "saving" || saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("admin.listings.autosave.saving")}
            </>
          ) : autosave.status === "error" ? (
            <>
              <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
              {t("admin.listings.autosave.failed")}
            </>
          ) : dirty ? (
            t("admin.listings.unsaved")
          ) : autosave.status === "saved" ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t("admin.listings.autosave.saved", { time })}
            </>
          ) : null}
        </p>
        <Button type="button" size="sm" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("admin.listings.save")}
        </Button>
      </div>
    </div>
  );
}
