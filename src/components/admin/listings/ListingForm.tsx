import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ListingFormSchema, type ListingFormValues } from "@/lib/listings/admin-schema";
import {
  adminListingQueryOptions,
  adminListingsQueryOptions,
  saveListing,
} from "@/lib/listings/admin.functions";
import { applies } from "@/lib/listings/field-visibility";
import { buildPublishChecklist } from "@/lib/listings/publish-checklist";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { FALLBACK_LOCALE } from "@/i18n/config";
import type { Country } from "@/lib/validation/energy";
import { useListingForm, type ListingFormApi } from "./listing-form-state";
import { useListingAutosave } from "./use-listing-autosave";
import { SectionStep } from "./FieldRow";
import { BasicsSection } from "./BasicsSection";
import { FiguresSection } from "./FiguresSection";
import { EquipmentSection } from "./EquipmentSection";
import { LocationSection } from "./LocationSection";
import { EnergySection } from "./EnergySection";
import { MoreDetailsSection } from "./MoreDetailsSection";
import { TranslatableBlock } from "./TranslatableBlock";
import { ImageManager } from "./ImageManager";
import { ChecklistRail } from "./ChecklistRail";
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  // URL locale, kept separate from the interface language of the panel.
  const { locale: routeLocale } = useParams({ strict: false }) as { locale?: string };
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const form: ListingFormApi = useListingForm(initial);
  // Content language: starts on the site's primary language, never on the
  // language the panel happens to be displayed in.
  const primaryLocale = locales[0] ?? settings.default_locale ?? FALLBACK_LOCALE;
  const [lang, setLang] = useState(primaryLocale);
  const [saving, setSaving] = useState(false);

  const listingId = (form.values.id as string | undefined) ?? null;
  const navLocale = routeLocale ?? primaryLocale;

  const shape = {
    property_type: form.values.property_type,
    deal_type: form.values.deal_type,
  };

  const checklist = buildPublishChecklist({
    values: form.values,
    imageCount: images.length,
    country: settings.country as Country,
  });

  /** Guards against two changes in the same tick creating two rows. */
  const creating = useRef<Promise<string> | null>(null);

  /**
   * Insert the row the first time it is actually needed, then hand over to the
   * editor route under the real id so a refresh lands on the saved draft.
   */
  async function ensureListingId(): Promise<string> {
    if (listingId) return listingId;
    if (creating.current) return creating.current;
    const pending = (async () => {
      const parsed = ListingFormSchema.parse(form.values);
      const result = await saveListing({ data: parsed });
      form.markClean();
      queryClient.invalidateQueries(adminListingsQueryOptions);
      await navigate({
        to: "/$locale/admin/listings/$id",
        params: { locale: navLocale, id: result.id },
        replace: true,
      });
      return result.id;
    })();
    creating.current = pending;
    try {
      return await pending;
    } catch (error) {
      creating.current = null;
      throw error;
    }
  }

  // First meaningful edit creates the row. `dirty` only flips on a real value
  // change, so focusing a field or opening a select changes nothing.
  useEffect(() => {
    if (listingId || !form.dirty) return;
    void ensureListingId().catch((error) => {
      toast.error(error instanceof Error ? error.message : String(error));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, form.dirty]);

  /** Content-only save. Status is never touched here — publishing is explicit. */
  async function save({ silent = false }: { silent?: boolean } = {}): Promise<boolean> {
    setSaving(true);
    try {
      if (!listingId) {
        await ensureListingId();
        if (!silent) toast.success(t("admin.listings.saved"));
        return true;
      }
      const parsed = ListingFormSchema.parse(form.values);
      await saveListing({ data: parsed });
      form.markClean();
      queryClient.invalidateQueries(adminListingsQueryOptions);
      if (!silent) toast.success(t("admin.listings.saved"));
      await queryClient.invalidateQueries(adminListingQueryOptions(listingId));
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
      <h1 className="font-heading text-2xl">
        {form.values.title?.[lang]?.trim() ||
          Object.values(form.values.title ?? {}).find((v) => v.trim())?.trim() ||
          t("admin.listings.untitled")}
      </h1>

      {listingId ? (
        <StatusBar
          listingId={listingId}
          status={status}
          slug={slug}
          dirty={form.dirty}
          hasImages={images.length > 0}
          dealType={form.values.deal_type}
          checklist={checklist}
          publicLocale={navLocale}
          onChanged={refreshListing}
        />
      ) : null}

      {/* The checklist is the navigation: sticky rail on the right, form on the
          left, sections in the order a broker fills them — photos last, so the
          photo grid never pushes the rest of the form off the screen. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          {/* Step numbers follow the rendered order, so a section hidden by
              property type leaves no gap in the sequence. */}
          {[
            <BasicsSection key="basics" form={form} />,
            <FiguresSection key="figures" form={form} />,
            <LocationSection key="location" form={form} />,
            <EquipmentSection key="equipment" form={form} />,
            <TranslatableBlock
              key="texts"
              form={form}
              lang={lang}
              locales={locales}
              primaryLocale={primaryLocale}
              onLangChange={setLang}
              listingId={listingId}
              publicLocale={navLocale}
              onError={(message) => toast.error(message)}
            />,
            applies(shape, "energy") ? <EnergySection key="energy" form={form} /> : null,
            <MoreDetailsSection key="more" form={form} lang={lang} />,
            <ImageManager
              key="images"
              listingId={listingId}
              images={images}
              refresh={refreshListing}
              ensureListingId={ensureListingId}
            />,
          ]
            .filter((node): node is React.ReactElement => node !== null)
            .map((node, index) => (
              <SectionStep key={node.key} value={index + 1}>
                {node}
              </SectionStep>
            ))}
        </div>

        <ChecklistRail checklist={checklist} />
      </div>


      <SaveBar
        dirty={form.dirty}
        saving={saving}
        autosave={autosave.state}
        onSave={() => void save()}
      />
    </form>
  );
}
