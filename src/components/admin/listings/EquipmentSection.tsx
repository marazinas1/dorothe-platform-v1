import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HEATING_TYPES,
  LISTING_CONDITIONS,
  featuresForType,
} from "@/lib/listings/vocabularies";
import { applies } from "@/lib/listings/field-visibility";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

/**
 * Condition, heating and the equipment checklist. The feature list is filtered
 * by property type (a plot never offers a lift); switching type deselects keys
 * that stop applying, which happens in the form state setter.
 */
export function EquipmentSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { values } = form;
  const selected = values.features ?? [];
  const available = featuresForType(values.property_type);
  const showCondition = applies(values.property_type, "condition");
  const showHeating = applies(values.property_type, "heating_type");
  // A plot has neither condition nor heating and no equipment worth listing.
  if (!showCondition && !showHeating && available.length === 0) return null;

  function toggle(key: string, checked: boolean) {
    const next = checked
      ? [...selected, key]
      : selected.filter((existing) => existing !== key);
    form.setField("features", next);
  }

  return (
    <FormSection title={t("admin.listings.sections.equipment")}>
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {showCondition ? (
          <FieldRow label={t("admin.listings.fields.condition")}>
            <Select
              value={values.condition ?? "none"}
              onValueChange={(v) =>
                form.setField(
                  "condition",
                  v === "none" ? null : (v as (typeof LISTING_CONDITIONS)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.listings.notSet")}</SelectItem>
                {LISTING_CONDITIONS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`listings.condition.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          ) : null}

          {showHeating ? (
          <FieldRow label={t("admin.listings.fields.heating_type")}>
            <Select
              value={values.heating_type ?? "none"}
              onValueChange={(v) =>
                form.setField(
                  "heating_type",
                  v === "none" ? null : (v as (typeof HEATING_TYPES)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.listings.notSet")}</SelectItem>
                {HEATING_TYPES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`listings.heating.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          ) : null}
        </div>

        {available.length > 0 ? (
          <fieldset className="grid gap-3">
            <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("admin.listings.fields.features")}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {available.map((key) => (
                <label
                  key={key}
                  htmlFor={`feature-${key}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <Checkbox
                    id={`feature-${key}`}
                    checked={selected.includes(key)}
                    onCheckedChange={(checked) => toggle(key, checked === true)}
                  />
                  {t(`listings.features.${key}`)}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>
    </FormSection>
  );
}
