import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

/**
 * SEO metadata, collapsed by default — it matters, but it is the last thing a
 * broker fills in. Empty fields fall back to the title and description.
 */
export function SeoSection({ form, lang }: { form: ListingFormApi; lang: string }) {
  const { t } = useTranslation();
  const { values } = form;
  const suffix = ` (${lang.toUpperCase()})`;

  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 font-heading text-lg sm:px-6">
        {t("admin.listings.sections.seo")}
      </summary>
      <div className="grid gap-4 border-t border-border px-4 py-4 sm:grid-cols-2 sm:px-6">
        <FieldRow
          label={t("admin.listings.fields.meta_title") + suffix}
          help={t("admin.listings.help.meta")}
        >
          <Input
            value={values.meta_title?.[lang] ?? ""}
            onChange={(e) => form.setTranslated("meta_title", lang, e.target.value)}
          />
        </FieldRow>
        <FieldRow label={t("admin.listings.fields.meta_description") + suffix}>
          <Input
            value={values.meta_description?.[lang] ?? ""}
            onChange={(e) => form.setTranslated("meta_description", lang, e.target.value)}
          />
        </FieldRow>
      </div>
    </details>
  );
}
