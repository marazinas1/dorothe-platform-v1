import { useTranslation } from "react-i18next";

import { fieldsAtLevel } from "@/lib/listings/field-visibility";
import type { ListingFormApi } from "./listing-form-state";
import { FormSection } from "./FieldRow";
import { PriceGroup } from "./PriceGroup";
import { NUMERIC_KEYS, NumberFields } from "./NumberFields";
import { TenancyFields } from "./TenancyFields";

/**
 * The figures a buyer asks about before arranging a viewing: money on top,
 * measurements below. Which measurements appear depends on the property type —
 * a plot has no rooms, a commercial unit has commercial area instead of living
 * area. Everything else lives in "More details".
 */
export function FiguresSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const shape = {
    property_type: form.values.property_type,
    deal_type: form.values.deal_type,
  };
  const openNumbers = fieldsAtLevel(shape, NUMERIC_KEYS, "open");

  return (
    <FormSection anchor="price" title={t("admin.listings.sections.figures")}>
      <div className="grid gap-8">
        <div className="grid gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.listings.groups.price")}
          </h3>
          <PriceGroup form={form} />
        </div>
        {openNumbers.length > 0 ? (
          <div className="grid gap-4 border-t border-border pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("admin.listings.groups.size")}
            </h3>
            <NumberFields form={form} keys={openNumbers} />
          </div>
        ) : null}
        <TenancyFields form={form} level="open" />
      </div>
    </FormSection>
  );
}
