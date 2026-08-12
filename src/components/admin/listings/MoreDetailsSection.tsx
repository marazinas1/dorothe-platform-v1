import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { applies, fieldsAtLevel } from "@/lib/listings/field-visibility";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";
import { NUMERIC_KEYS, NumberFields } from "./NumberFields";
import { TenancyFields } from "./TenancyFields";
import { SeoSection } from "./SeoSection";

/**
 * One single collapse for everything that is not part of the short path to
 * publish. A listing can go live without opening it, so the default form stays
 * short; brokers who want the full record are one click away.
 */
export function MoreDetailsSection({
  form,
  lang,
}: {
  form: ListingFormApi;
  lang: string;
}) {
  const { t } = useTranslation();
  const shape = {
    property_type: form.values.property_type,
    deal_type: form.values.deal_type,
  };
  const detailNumbers = fieldsAtLevel(shape, NUMERIC_KEYS, "details");

  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 sm:px-6">
        <span className="font-heading text-lg">{t("admin.listings.sections.more")}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {t("admin.listings.help.more")}
        </span>
      </summary>
      <div className="grid gap-6 border-t border-border px-4 py-5 sm:px-6">
        {applies(shape, "reference_code") ? (
          <FieldRow
            label={t("admin.listings.fields.reference_code")}
            help={t("admin.listings.help.reference_code")}
            className="sm:max-w-xs"
          >
            <Input
              value={form.values.reference_code ?? ""}
              onChange={(e) =>
                form.setField("reference_code", e.target.value.trim() || null)
              }
            />
          </FieldRow>
        ) : null}
        {detailNumbers.length > 0 ? (
          <NumberFields form={form} keys={detailNumbers} />
        ) : null}
        <TenancyFields form={form} level="details" />
        <SeoSection form={form} lang={lang} />
      </div>
    </details>
  );
}

