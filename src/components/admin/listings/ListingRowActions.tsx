import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { allowedTransitions } from "@/lib/listings/admin-schema";
import { PreviewButton } from "./PreviewButton";
import { useStatusChange } from "./use-status-change";

/** Publish / unpublish / preview straight from the listings table. */
export function ListingRowActions({
  id,
  status,
  locale,
}: {
  id: string;
  status: string;
  locale: string;
}) {
  const { t } = useTranslation();
  const { apply, busy, error, setError } = useStatusChange();
  const targets = allowedTransitions(status);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-2">
        <PreviewButton listingId={id} locale={locale} onError={setError} />
        {targets.includes("draft") ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void apply(id, "draft")}
          >
            {t("admin.listings.unpublish")}
          </Button>
        ) : null}
        {targets.includes("active") ? (
          <Button
            type="button"
            size="sm"
            disabled={busy !== null}
            onClick={() => void apply(id, "active")}
          >
            {t("admin.listings.publish")}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="max-w-[320px] text-right text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
