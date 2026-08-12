import { useTranslation } from "react-i18next";

import { fieldsAtLevel } from "@/lib/listings/field-visibility";
import type { ListingFormApi } from "./listing-form-state";
import { NUMERIC_KEYS, NumberFields } from "./NumberFields";
import { MarketSection } from "./MarketSection";
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
  const detailNumbers = fieldsAtLevel(form.values.property_type, NUMERIC_KEYS, "details");

  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 sm:px-6">
        <span className="font-heading text-lg">{t("admin.listings.sections.more")}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {t("admin.listings.help.more")}
        </span>
      </summary>
      <div className="grid gap-6 border-t border-border px-4 py-5 sm:px-6">
        {detailNumbers.length > 0 ? (
          <NumberFields form={form} keys={detailNumbers} />
        ) : null}
        <MarketSection form={form} />
        <SeoSection form={form} lang={lang} />
      </div>
    </details>
  );
}
