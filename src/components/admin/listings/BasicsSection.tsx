import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

import { DEAL_TYPES, PROPERTY_TYPES } from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

/** Title / description per language plus deal & property type. */
export function BasicsSection({
  form,
  lang,
}: {
  form: ListingFormApi;
  lang: string;
}) {
  const { t } = useTranslation();
  const { values } = form;

  return (
    <FormSection title={t("admin.listings.sections.basics")}>
      <div className="grid gap-4">
        <FieldRow label={`${t("admin.listings.fields.title")} (${lang.toUpperCase()})`}>
          <Input
            value={values.title?.[lang] ?? ""}
            onChange={(e) => form.setTranslated("title", lang, e.target.value)}
          />
        </FieldRow>
        <FieldRow
          label={`${t("admin.listings.fields.description")} (${lang.toUpperCase()})`}
        >
          <Textarea
            rows={6}
            value={values.description?.[lang] ?? ""}
            onChange={(e) => form.setTranslated("description", lang, e.target.value)}
          />
        </FieldRow>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label={t("admin.listings.fields.deal_type")}>
            <Select
              value={values.deal_type}
              onValueChange={(v) =>
                form.setField("deal_type", v as (typeof DEAL_TYPES)[number])
              }
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
          <FieldRow label={t("admin.listings.fields.property_type")}>
            <Select
              value={values.property_type}
              onValueChange={(v) =>
                form.setField("property_type", v as (typeof PROPERTY_TYPES)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`admin.listings.propertyType.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      </div>
    </FormSection>
  );
}
