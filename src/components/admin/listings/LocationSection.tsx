import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { GEO_PRECISIONS } from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";
import { AddressMapPicker } from "./AddressMapPicker";

const TEXT_FIELDS = [
  "address_street",
  "address_number",
  "address_zip",
  "address_city",
  "address_region",
  "address_country",
] as const;

/**
 * Address, map position and geo precision. The raw coordinates are stored on
 * `listings`; the public `listings_public` view masks them, so what the visitor
 * sees follows from this selector without any public-side code change.
 */
export function LocationSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { values } = form;

  return (
    <FormSection title={t("admin.listings.sections.location")}>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEXT_FIELDS.map((key) => (
            <FieldRow key={key} label={t(`admin.listings.fields.${key}`)}>
              <Input
                value={values[key] ?? ""}
                onChange={(e) => form.setField(key, e.target.value || null)}
              />
            </FieldRow>
          ))}
        </div>

        <AddressMapPicker form={form} />

        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.listings.fields.geo_precision")}
          </Label>
          <RadioGroup
            value={values.geo_precision ?? "approximate"}
            onValueChange={(v) =>
              form.setField("geo_precision", v as (typeof GEO_PRECISIONS)[number])
            }
            className="grid gap-2"
          >
            {GEO_PRECISIONS.map((option) => (
              <label
                key={option}
                htmlFor={`geo-${option}`}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2"
              >
                <RadioGroupItem id={`geo-${option}`} value={option} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">
                    {t(`admin.listings.geo.${option}.label`)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t(`admin.listings.geo.${option}.help`)}
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>
    </FormSection>
  );
}
