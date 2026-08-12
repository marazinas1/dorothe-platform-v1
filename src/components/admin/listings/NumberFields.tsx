import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import type { VisibleField } from "@/lib/listings/field-visibility";
import { areaLabelKey } from "@/lib/listings/field-labels";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

export type NumericKey = Extract<
  VisibleField,
  | "living_area"
  | "usable_area"
  | "plot_area"
  | "rooms"
  | "bedrooms"
  | "bathrooms"
  | "floor"
  | "total_floors"
  | "year_built"
  | "year_renovated"
>;

const STEP: Partial<Record<NumericKey, string>> = {
  living_area: "0.01",
  usable_area: "0.01",
  plot_area: "0.01",
  rooms: "0.5",
};

/** Numeric fields, rendered in the order given by the caller. */
export function NumberFields({
  form,
  keys,
}: {
  form: ListingFormApi;
  keys: readonly NumericKey[];
}) {
  const { t } = useTranslation();
  const { values } = form;
  if (keys.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {keys.map((key) => (
        <FieldRow key={key} anchor={key} label={t(areaLabelKey(values.property_type, key))}>
          <Input
            type="number"
            inputMode="decimal"
            step={STEP[key]}
            value={values[key] === null || values[key] === undefined ? "" : String(values[key])}
            onChange={(e) =>
              form.setField(key, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </FieldRow>
      ))}
    </div>
  );
}

/** All numeric keys in reading order; callers filter by visibility level. */
export const NUMERIC_KEYS: readonly NumericKey[] = [
  "living_area",
  "usable_area",
  "plot_area",
  "rooms",
  "bedrooms",
  "bathrooms",
  "floor",
  "total_floors",
  "year_built",
  "year_renovated",
];
