import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListingsBrowser } from "@/components/admin/listings/ListingsBrowser";
import { adminListingsQueryOptions } from "@/lib/listings/admin.functions";

export const Route = createFileRoute("/$locale/admin/listings/")({
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
