import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListingsBrowser } from "@/components/admin/listings/ListingsBrowser";
import { adminListingsQueryOptions } from "@/lib/listings/admin.functions";
import { cleanupAbandonedDrafts } from "@/lib/listings/autodraft.functions";

export const Route = createFileRoute("/$locale/admin/listings/")({
  // Auto-created drafts that were never filled in are removed here, so the
  // "photos first" flow cannot silently pile up junk rows.
  loader: async ({ context }) => {
    const { removed } = await cleanupAbandonedDrafts().catch(() => ({ removed: 0 }));
    if (removed > 0) await context.queryClient.invalidateQueries(adminListingsQueryOptions);
  },
  component: ListingsIndex,
});

function ListingsIndex() {
  const { t } = useTranslation();
  const { locale } = Route.useParams();
  const { data } = useSuspenseQuery(adminListingsQueryOptions);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl">{t("admin.pages.listings")}</h1>
        <Button asChild>
          <Link to="/$locale/admin/listings/new" params={{ locale }}>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.listings.new")}
          </Link>
        </Button>
      </div>
      <ListingsBrowser rows={data} locale={locale} />
    </div>
  );
}
