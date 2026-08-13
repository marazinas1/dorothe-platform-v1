import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, Check, ChevronDown, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import type { AdminListingRow } from "@/lib/listings/admin.functions";
import type { ListingStatus } from "@/lib/listings/admin-schema";
import { blockerSummary } from "@/lib/listings/blocker-summary";
import { rowPublishBlockers } from "@/lib/listings/row-publish-check";
import {
  requiresChecklist,
  statusOptionsFor,
  statusTone,
  TONE_BADGE_CLASS,
  TONE_DOT_CLASS,
} from "@/lib/listings/status-options";
import { useStatusChange } from "./use-status-change";

/**
 * The single status control: it shows the current lifecycle state and switches
 * to any state that is valid for this listing. Visibility follows from status,
 * so there is deliberately no second "published" toggle.
 */
export function ListingStatusSelect({ row }: { row: AdminListingRow }) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { apply, busy, error } = useStatusChange();
  const [blocked, setBlocked] = useState<string | null>(null);

  const tone = statusTone(row.status);
  const options = statusOptionsFor(row.status, row.deal_type);

  function choose(target: ListingStatus) {
    setBlocked(null);
    if (requiresChecklist(target)) {
      const missing = rowPublishBlockers(row, settings.country);
      if (missing.length > 0) {
        setBlocked(blockerSummary(t, missing));
        return;
      }
    }
    void apply(row.id, target);
  }

  return (
    <div className="min-w-0">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[12px] font-medium tracking-[0.01em] transition-opacity hover:opacity-80 disabled:opacity-60 ${TONE_BADGE_CLASS[tone]}`}
          disabled={busy !== null || options.length === 0}
          aria-label={t("admin.listings.statusSelect.label")}
        >
          {busy !== null ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${TONE_DOT_CLASS[tone]}`} />
          )}
          {t(`listings.status.${row.status}`)}
          {options.length > 0 ? <ChevronDown className="h-3 w-3 opacity-70" /> : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem disabled className="opacity-100">
            <Check className="mr-2 h-4 w-4" />
            {t(`listings.status.${row.status}`)}
          </DropdownMenuItem>
          {options.map((target) => (
            <DropdownMenuItem key={target} onSelect={() => choose(target)}>
              <span
                aria-hidden
                className={`mr-2 h-1.5 w-1.5 rounded-full ${TONE_DOT_CLASS[statusTone(target)]}`}
              />
              {t(`listings.status.${target}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {blocked ? (
        <p className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            {t("admin.listings.publishBlocked")} {blocked}
          </span>
        </p>
      ) : null}

      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
