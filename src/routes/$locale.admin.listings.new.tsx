import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { createAutoDraft } from "@/lib/listings/autodraft.functions";

export const Route = createFileRoute("/$locale/admin/listings/new")({
  component: NewListing,
});

/**
 * "New listing" creates the draft row immediately and hands over to the editor,
 * so photos can be uploaded before anything else is filled in. Drafts that stay
 * empty are cleaned up from the listings screen.
 */
function NewListing() {
  const { t } = useTranslation();
  const { locale } = Route.useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const { id } = await createAutoDraft();
        await navigate({
          to: "/$locale/admin/listings/$id",
          params: { locale, id },
          replace: true,
        });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    })();
  }, [locale, navigate]);

  return (
    <div className="flex min-h-40 items-center justify-center">
      {error ? (
        <p className="text-sm text-destructive">
          {t("admin.listings.autodraft.failed")} {error}
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("admin.listings.autodraft.creating")}
        </p>
      )}
    </div>
  );
}
