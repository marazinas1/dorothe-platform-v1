import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

type NumericKey =
  | "living_area"
  | "plot_area"
  | "usable_area"
  | "rooms"
  | "bedrooms"
  | "bathrooms"
  | "floor"
  | "total_floors"
  | "year_built"
  | "year_renovated";

const FIELDS: { key: NumericKey; step?: string }[] = [
  { key: "living_area", step: "0.01" },
  { key: "plot_area", step: "0.01" },
  { key: "usable_area", step: "0.01" },
  { key: "rooms", step: "0.5" },
  { key: "bedrooms" },
  { key: "bathrooms" },
  { key: "floor" },
  { key: "total_floors" },
  { key: "year_built" },
  { key: "year_renovated" },
];

/** Areas, rooms, floors and years — the measurable side of a listing. */
export function SizeGroup({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { values } = form;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FIELDS.map(({ key, step }) => (
        <FieldRow key={key} label={t(`admin.listings.fields.${key}`)}>
          <Input
            type="number"
            inputMode="decimal"
            step={step}
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
