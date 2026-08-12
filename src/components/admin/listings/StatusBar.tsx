import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { allowedTransitions, type ListingStatus } from "@/lib/listings/admin-schema";
import type { Checklist } from "@/lib/listings/publish-checklist";
import { scrollToField } from "@/lib/listings/scroll-to-field";
import { PreviewButton } from "./PreviewButton";
import { useStatusChange } from "./use-status-change";

/**
 * Status bar with explicit publish / unpublish actions. Publishing is only
 * offered when the checklist says the database would accept it — a call that is
 * known to fail is never made. The database still has the final say and its
 * reason is shown inline.
 */
export function StatusBar({
  listingId,
  status,
  slug,
  dirty,
  hasImages,
  checklist,
  publicLocale,
  onChanged,
}: {
  listingId: string;
  status: string | null;
  slug: string | null;
  dirty: boolean;
  hasImages: boolean;
  checklist: Checklist;
  /** Locale for public links — the site's language, not the panel language. */
  publicLocale: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const { apply, busy, error, setError } = useStatusChange(onChanged);
  // The blocker list is only revealed once the broker asks to publish, so an
  // untouched draft is not covered in warnings.
  const [showBlockers, setShowBlockers] = useState(false);
  const targets = allowedTransitions(status);
  const isPublic = status === "active" || status === "coming_soon";
  const canPublish = targets.includes("active");
  const canUnpublish = targets.includes("draft");
  const secondary = targets.filter((s) => s !== "active" && s !== "draft");
  const locked = dirty || busy !== null;
  const blocking = checklist.items.filter((item) => !item.done);
  const publishBlocked = blocking.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {t("admin.listings.fields.status")}
        </span>
        <Badge variant={isPublic ? "default" : "secondary"}>
          {t(`listings.status.${status ?? "draft"}`)}
        </Badge>

        {isPublic && slug ? (
          <Link
            to="/$locale/immobilien/$slug"
            params={{ locale: publicLocale, slug }}
            target="_blank"
            className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("admin.listings.viewPublic")}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {dirty ? (
            <span className="text-xs text-muted-foreground">
              {t("admin.listings.saveBeforeStatus")}
            </span>
          ) : null}

          <PreviewButton
            listingId={listingId}
            locale={publicLocale}
            disabled={dirty}
            onError={setError}
          />

          {secondary.map((target) => (
            <Button
              key={target}
              type="button"
              size="sm"
              variant="ghost"
              disabled={locked}
              onClick={() => void apply(listingId, target as ListingStatus)}
            >
              {t(`admin.listings.statusAction.${target}`)}
            </Button>
          ))}

          {canUnpublish ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={locked}
              onClick={() => void apply(listingId, "draft")}
            >
              {t("admin.listings.unpublish")}
            </Button>
          ) : null}

          {canPublish ? (
            <Button
              type="button"
              size="sm"
              disabled={locked}
              onClick={() => {
                // Never make a call the checklist knows the database rejects —
                // show what is missing instead.
                if (publishBlocked) {
                  setShowBlockers(true);
                  scrollToField(blocking[0].anchor);
                  return;
                }
                void apply(listingId, "active");
              }}
            >
              {t("admin.listings.publish")}
            </Button>
          ) : null}
        </div>
      </div>

      {canPublish && publishBlocked && showBlockers ? (
        <p className="flex items-start gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {t("admin.listings.publishBlocked")}{" "}
            {blocking
              .map((item) =>
                item.missing?.length
                  ? `${t(`admin.listings.checklist.items.${item.key}`)} (${item.missing
                      .map((key) => t(`admin.listings.energyFields.${key}`))
                      .join(", ")})`
                  : t(`admin.listings.checklist.items.${item.key}`),
              )
              .join(" · ")}
          </span>
        </p>
      ) : canPublish && !hasImages ? (
        <p className="flex items-start gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("admin.listings.noImagesWarning")}
        </p>
      ) : null}

      {error ? (
        <p className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          <span className="font-medium">{t("admin.listings.publishFailed")}</span> {error}
        </p>
      ) : null}
    </div>
  );
}
