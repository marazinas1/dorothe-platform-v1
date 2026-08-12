import { useTranslation } from "react-i18next";

import { fieldsAtLevel, isOpen } from "@/lib/listings/field-visibility";
import type { ListingFormApi } from "./listing-form-state";
import { FormSection } from "./FieldRow";
import { PriceGroup } from "./PriceGroup";
import { NUMERIC_KEYS, NumberFields } from "./NumberFields";

/**
 * The figures a buyer asks about before arranging a viewing: money on top,
 * measurements below. Which measurements appear depends on the property type —
 * a plot has no rooms, a commercial unit has commercial area instead of living
 * area. Everything else lives in "More details".
 */
export function FiguresSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const type = form.values.property_type;
  const openNumbers = fieldsAtLevel(type, NUMERIC_KEYS, "open");

  return (
    <FormSection title={t("admin.listings.sections.figures")}>
      <div className="grid gap-8">
        <div className="grid gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.listings.groups.price")}
          </h3>
          <PriceGroup form={form} showServiceCharge={isOpen(type, "service_charge")} />
        </div>
        {openNumbers.length > 0 ? (
          <div className="grid gap-4 border-t border-border pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("admin.listings.groups.size")}
            </h3>
            <NumberFields form={form} keys={openNumbers} />
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}
