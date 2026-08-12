import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/admin/listings/ListingForm";
import { EMPTY_VALUES } from "@/components/admin/listings/listing-form-state";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";

export const Route = createFileRoute("/$locale/admin/listings/new")({
  component: NewListing,
});

/**
 * "New listing" renders an empty form and inserts nothing. The row is created
 * on the first meaningful action (a field gaining a value, or photos being
 * dropped), so arriving and leaving leaves no junk draft behind.
 */
function NewListing() {
  const { t } = useTranslation();
  const { locale } = Route.useParams();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  return (
    <div className="space-y-6">
      <Link
        to="/$locale/admin/listings"
        params={{ locale }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("admin.pages.listings")}
      </Link>
      <ListingForm
        initial={{
          ...EMPTY_VALUES,
          // Country comes from configuration, never from code.
          address_country: settings.address_country ?? settings.country ?? null,
        }}
        locales={settings.enabled_locales}
        status={null}
        slug={null}
        images={[]}
      />
    </div>
  );
}
