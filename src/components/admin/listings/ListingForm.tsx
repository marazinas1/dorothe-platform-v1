import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingFormSchema, type ListingFormValues } from "@/lib/listings/admin-schema";
import {
  adminListingQueryOptions,
  adminListingsQueryOptions,
  saveListing,
} from "@/lib/listings/admin.functions";
import { useListingForm, type ListingFormApi } from "./listing-form-state";
import { useListingAutosave } from "./use-listing-autosave";
import { BasicsSection } from "./BasicsSection";
import { FiguresSection } from "./FiguresSection";
import { MarketSection } from "./MarketSection";
import { LocationSection } from "./LocationSection";
import { EnergySection } from "./EnergySection";
import { SeoSection } from "./SeoSection";
import { ContentSectionsEditor } from "./ContentSectionsEditor";
import { ImageManager } from "./ImageManager";
import { PublishChecklist } from "./PublishChecklist";
import { StatusBar } from "./StatusBar";
import { SaveBar } from "./SaveBar";
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

  /** Content-only save. Status is never touched here — publishing is explicit. */
  async function save({ silent = false }: { silent?: boolean } = {}): Promise<boolean> {
    setSaving(true);
    try {
      const parsed = ListingFormSchema.parse(form.values);
      const result = await saveListing({ data: parsed });
      form.markClean();
      queryClient.invalidateQueries(adminListingsQueryOptions);
      if (!silent) toast.success(t("admin.listings.saved"));
      if (!listingId) {
        await navigate({
          to: "/$locale/admin/listings/$id",
          params: { locale: i18n.language, id: result.id },
        });
      } else {
        await queryClient.invalidateQueries(adminListingQueryOptions(listingId));
      }
      return true;
    } catch (error) {
      if (!silent) toast.error(error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setSaving(false);
    }
  }

  const autosave = useListingAutosave({
    dirty: form.dirty,
    enabled: !!listingId,
    save: () => save({ silent: true }),
  });

  function refreshListing() {
    if (listingId) void queryClient.invalidateQueries(adminListingQueryOptions(listingId));
  }

  return (
    <form
      className="space-y-6"
      onBlur={() => void autosave.flush()}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t("admin.listings.contentLanguage")}
          </span>
          <Tabs value={lang} onValueChange={setLang}>
            <TabsList>
              {locales.map((code) => (
                <TabsTrigger key={code} value={code}>
                  {code.toUpperCase()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <p className="max-w-sm text-xs text-muted-foreground">
          {t("admin.listings.contentLanguageHint")}
        </p>
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

      <PublishChecklist values={form.values} imageCount={images.length} />

      <ImageManager
        listingId={listingId}
        images={images}
        refresh={refreshListing}
        onSaveDraft={() => void save()}
        savingDraft={saving}
      />
      <BasicsSection form={form} lang={lang} />
      <LocationSection form={form} />
      <FiguresSection form={form} />
      <MarketSection form={form} />
      <ContentSectionsEditor form={form} lang={lang} />
      <EnergySection form={form} />
      <SeoSection form={form} lang={lang} />

      <SaveBar
        dirty={form.dirty}
        saving={saving}
        autosave={autosave.state}
        onSave={() => void save()}
      />
    </form>
  );
}
