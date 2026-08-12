import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

/**
 * The title is the first thing a broker types, so it sits at the very top —
 * every enabled language side by side, with the primary one marked. A missing
 * optional language falls back to the primary text on the public site, which the
 * placeholder shows.
 */
export function TitleFields({
  form,
  locales,
  primaryLocale,
}: {
  form: ListingFormApi;
  locales: string[];
  primaryLocale: string;
}) {
  const { t } = useTranslation();
  const titles = form.values.title ?? {};
  const primaryValue = titles[primaryLocale]?.trim() ?? "";

  return (
    <FormSection anchor="title" title={t("admin.listings.fields.title")}>
      <div className={`grid gap-4 ${locales.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {locales.map((code) => (
          <FieldRow
            key={code}
            anchor={code === primaryLocale ? "title_primary" : undefined}
            label={`${code.toUpperCase()} · ${
              code === primaryLocale
                ? t("admin.listings.localePrimary")
                : t("admin.listings.localeOptional")
            }`}
            help={
              code === primaryLocale
                ? t("admin.listings.help.title")
                : t("admin.listings.help.titleOptional", {
                    locale: primaryLocale.toUpperCase(),
                  })
            }
          >
            <Input
              value={titles[code] ?? ""}
              placeholder={code === primaryLocale ? "" : primaryValue}
              onChange={(e) => form.setTranslated("title", code, e.target.value)}
            />
          </FieldRow>
        ))}
      </div>
    </FormSection>
  );
}
