import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/admin/listings/ListingForm";
import { rowToValues } from "@/components/admin/listings/listing-form-state";
import type { ImageRecord } from "@/components/admin/listings/ImageCard";
import { adminListingQueryOptions } from "@/lib/listings/admin.functions";
import { scrollToField } from "@/lib/listings/scroll-to-field";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";

export const Route = createFileRoute("/$locale/admin/listings/$id")({
  // ?field=<anchor> lets the dashboard hand over to the exact field to fix.
  validateSearch: (search: Record<string, unknown>): { field?: string } =>
    typeof search.field === "string" ? { field: search.field } : {},
  component: EditListing,
});


function EditListing() {
  const { t } = useTranslation();
  const { locale, id } = Route.useParams();
  const { field } = Route.useSearch();
  const { data } = useSuspenseQuery(adminListingQueryOptions(id));
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);

  // Arriving from the dashboard: open the section and land on the named field.
  useEffect(() => {
    if (!field) return;
    const timer = window.setTimeout(() => scrollToField(field), 120);
    return () => window.clearTimeout(timer);
  }, [field, id]);

  const listing = data.listing as Record<string, unknown>;


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
      {/* key: remount the form when switching listings so state can't leak */}
      <ListingForm
        key={id}
        initial={rowToValues(listing)}
        locales={settings.enabled_locales}
        status={(listing.status as string) ?? null}
        slug={(listing.slug as string) ?? null}
        publishedEver={Boolean(listing.published_at)}
        images={data.images as unknown as ImageRecord[]}
      />
    </div>
  );
}
