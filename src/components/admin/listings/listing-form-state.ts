// Form state for the admin listing form. Kept outside the components so the
// section components stay presentational and small.
import { useCallback, useMemo, useState } from "react";

import {
  CONTENT_SECTION_KEYS,
  type ContentSectionKey,
  type ListingFormValues,
} from "@/lib/listings/admin-schema";

export const EMPTY_VALUES: ListingFormValues = {
  title: {},
  description: {},
  meta_title: {},
  meta_description: {},
  deal_type: "sale",
  property_type: "apartment",
  price: null,
  price_on_request: false,
  price_period: null,
  living_area: null,
  plot_area: null,
  usable_area: null,
  rooms: null,
  bedrooms: null,
  bathrooms: null,
  floor: null,
  total_floors: null,
  year_built: null,
  year_renovated: null,
  address_street: null,
  address_number: null,
  address_zip: null,
  address_city: null,
  address_region: null,
  address_country: null,
  geo_lat: null,
  geo_lng: null,
  geo_precision: "approximate",
  service_charge: null,
  commission_value: null,
  commission_type: null,
  commission_payer: null,
  rental_status: null,
  availability_date: null,
  energy_exemption: null,
  energy: {},
  content_sections: [],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Map a listings row onto form values, tolerating nulls and legacy shapes. */
export function rowToValues(row: Row): ListingFormValues {
  const out: ListingFormValues = { ...EMPTY_VALUES, id: row.id };
  for (const key of Object.keys(EMPTY_VALUES) as (keyof ListingFormValues)[]) {
    if (key === "content_sections" || key === "energy") continue;
    const value = row[key as string];
    if (value === undefined) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (out as any)[key] = value ?? EMPTY_VALUES[key];
  }
  out.energy = (row.energy && typeof row.energy === "object" ? row.energy : {}) as Record<
    string,
    unknown
  >;
  out.content_sections = normalizeSections(row.content_sections);
  return out;
}

function normalizeSections(value: unknown): ListingFormValues["content_sections"] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (s): s is { key: ContentSectionKey; items: Record<string, string[]> } =>
        !!s &&
        typeof s === "object" &&
        (CONTENT_SECTION_KEYS as readonly string[]).includes((s as Row).key),
    )
    .map((s) => ({
      key: s.key,
      items: Object.fromEntries(
        Object.entries(s.items ?? {}).map(([locale, items]) => [
          locale,
          Array.isArray(items) ? items.filter((i): i is string => typeof i === "string") : [],
        ]),
      ),
    }));
}

export function useListingForm(initial: ListingFormValues) {
  const [values, setValues] = useState<ListingFormValues>(initial);
  const [dirty, setDirty] = useState(false);

  const setField = useCallback(
    <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setDirty(true);
    },
    [],
  );

  const setTranslated = useCallback(
    (
      field: "title" | "description" | "meta_title" | "meta_description",
      locale: string,
      text: string,
    ) => {
      setValues((prev) => ({
        ...prev,
        [field]: { ...(prev[field] ?? {}), [locale]: text },
      }));
      setDirty(true);
    },
    [],
  );

  const setSectionItems = useCallback(
    (key: ContentSectionKey, locale: string, items: string[]) => {
      setValues((prev) => {
        const sections = [...(prev.content_sections ?? [])];
        const index = sections.findIndex((s) => s.key === key);
        if (index === -1) {
          sections.push({ key, items: { [locale]: items } });
        } else {
          sections[index] = {
            key,
            items: { ...sections[index].items, [locale]: items },
          };
        }
        return { ...prev, content_sections: sections };
      });
      setDirty(true);
    },
    [],
  );

  const setEnergyField = useCallback((field: string, value: unknown) => {
    setValues((prev) => {
      const energy = { ...(prev.energy ?? {}) } as Record<string, unknown>;
      if (value === "" || value === null || value === undefined) delete energy[field];
      else energy[field] = value;
      return { ...prev, energy };
    });
    setDirty(true);
  }, []);

  const reset = useCallback((next: ListingFormValues) => {
    setValues(next);
    setDirty(false);
  }, []);

  return useMemo(
    () => ({
      values,
      dirty,
      setField,
      setTranslated,
      setSectionItems,
      setEnergyField,
      reset,
      markClean: () => setDirty(false),
    }),
    [values, dirty, setField, setTranslated, setSectionItems, setEnergyField, reset],
  );
}

export type ListingFormApi = ReturnType<typeof useListingForm>;
