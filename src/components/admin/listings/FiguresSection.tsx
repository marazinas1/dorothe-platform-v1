import { useTranslation } from "react-i18next";

import type { ListingFormApi } from "./listing-form-state";
import { FormSection } from "./FieldRow";
import { PriceGroup } from "./PriceGroup";
import { SizeGroup } from "./SizeGroup";

/**
 * Two visually separate groups: money on top, measurements below. Brokers fill
 * them at different moments, so they are read as two blocks, not one long grid.
 */
export function FiguresSection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();

  return (
    <FormSection title={t("admin.listings.sections.figures")}>
      <div className="grid gap-8">
        <div className="grid gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.listings.groups.price")}
          </h3>
          <PriceGroup form={form} />
        </div>
        <div className="grid gap-4 border-t border-border pt-6">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("admin.listings.groups.size")}
          </h3>
          <SizeGroup form={form} />
        </div>
      </div>
    </FormSection>
  );
}
