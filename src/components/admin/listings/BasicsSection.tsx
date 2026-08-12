import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DEAL_TYPES,
  SELECTABLE_PROPERTY_TYPES,
  type PROPERTY_TYPES,
} from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

/**
 * Deal type and property type — the two answers that decide which fields the
 * rest of the form shows. A listing still holding a retired type keeps it as a
 * visible option until the broker picks one of the current ones.
 */
export function BasicsSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { values } = form;
  const current = values.property_type;
  const legacy = !(SELECTABLE_PROPERTY_TYPES as readonly string[]).includes(current);

  return (
    <FormSection title={t("admin.listings.sections.basics")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldRow label={t("admin.listings.fields.deal_type")}>
          <Select
            value={values.deal_type}
            onValueChange={(v) => form.setField("deal_type", v as (typeof DEAL_TYPES)[number])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_TYPES.map((d) => (
                <SelectItem key={d} value={d}>
                  {t(`admin.listings.deal.${d}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow
          label={t("admin.listings.fields.property_type")}
          help={legacy ? t("admin.listings.help.legacyPropertyType") : undefined}
        >
          <Select
            value={current}
            onValueChange={(v) =>
              form.setField("property_type", v as (typeof PROPERTY_TYPES)[number])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {legacy ? (
                <SelectItem value={current}>
                  {t(`admin.listings.propertyType.${current}`)}
                </SelectItem>
              ) : null}
              {SELECTABLE_PROPERTY_TYPES.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`admin.listings.propertyType.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
    </FormSection>
  );
}
