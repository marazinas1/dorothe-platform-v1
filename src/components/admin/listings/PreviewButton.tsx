import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createListingPreviewLink } from "@/lib/listings/preview.functions";

/**
 * Opens the public detail page for the listing's currently saved state in a
 * new tab, using a short-lived signed preview token. Anonymous visitors
 * without that token still get a 404 for unpublished listings.
 */
export function PreviewButton({
  listingId,
  locale,
  disabled,
  onError,
  size = "sm",
}: {
  listingId: string;
  locale: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  size?: "sm" | "default";
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const { slug, token } = await createListingPreviewLink({
        data: { id: listingId },
      });
      window.open(
        `/${locale}/immobilien/${slug}?preview=${encodeURIComponent(token)}`,
        "_blank",
        "noopener",
      );
    } catch (error) {
      onError?.(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      disabled={disabled || busy}
      onClick={() => void open()}
    >
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Eye className="mr-2 h-4 w-4" />
      )}
      {t("admin.listings.preview")}
    </Button>
  );
}
