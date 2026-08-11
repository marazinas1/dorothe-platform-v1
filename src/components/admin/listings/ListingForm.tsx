import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingFormSchema, type ListingFormValues } from "@/lib/listings/admin-schema";
import {
  adminListingQueryOptions,
  adminListingsQueryOptions,
  saveListing,
} from "@/lib/listings/admin.functions";
import { useListingForm, type ListingFormApi } from "./listing-form-state";
import { BasicsSection } from "./BasicsSection";
import { FiguresSection } from "./FiguresSection";
import { LocationSection } from "./LocationSection";
import { EnergySection } from "./EnergySection";
import { ContentSectionsEditor } from "./ContentSectionsEditor";
import { ImageManager } from "./ImageManager";
import { StatusBar } from "./StatusBar";
import type { ImageRecord } from "./ImageCard";

export function ListingForm({
  initial,
  locales,
  status,
  slug,
  images,
}: {
  initial: ListingFormValues;
  locales: string[];
  status: string | null;
  slug: string | null;
  images: ImageRecord[];
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form: ListingFormApi = useListingForm(initial);
  const [lang, setLang] = useState(locales[0] ?? i18n.language);
  const [saving, setSaving] = useState(false);

  const listingId = (form.values.id as string | undefined) ?? null;

  async function save() {
    setSaving(true);
    try {
      const parsed = ListingFormSchema.parse(form.values);
      const result = await saveListing({ data: parsed });
      form.markClean();
      queryClient.invalidateQueries(adminListingsQueryOptions);
      toast.success(t("admin.listings.saved"));
      if (!listingId) {
        await navigate({
          to: "/$locale/admin/listings/$id",
          params: { locale: i18n.language, id: result.id },
        });
      } else {
        await queryClient.invalidateQueries(adminListingQueryOptions(listingId));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  function refreshListing() {
    if (listingId) void queryClient.invalidateQueries(adminListingQueryOptions(listingId));
  }

  return (
    <form
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={lang} onValueChange={setLang}>
          <TabsList>
            {locales.map((code) => (
              <TabsTrigger key={code} value={code}>
                {code.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          {form.dirty ? (
            <span className="text-xs text-muted-foreground">
              {t("admin.listings.unsaved")}
            </span>
          ) : null}
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {listingId ? t("admin.listings.save") : t("admin.listings.saveDraft")}
          </Button>
        </div>
      </div>

      {listingId ? (
        <StatusBar
          listingId={listingId}
          status={status}
          slug={slug}
          dirty={form.dirty}
          hasImages={images.length > 0}
          onChanged={refreshListing}
        />
      ) : null}


      <BasicsSection form={form} lang={lang} />
      <FiguresSection form={form} />
      <LocationSection form={form} />
      <EnergySection form={form} />
      <ContentSectionsEditor form={form} lang={lang} />
      <ImageManager
        listingId={listingId}
        images={images}
        refresh={refreshListing}
        onSaveDraft={() => void save()}
        savingDraft={saving}
      />
    </form>
  );
}
