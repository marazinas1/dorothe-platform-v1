import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { fieldAnchorId } from "@/lib/listings/scroll-to-field";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

/**
 * The title sits inside the Texts section, directly above the description it
 * belongs with: every enabled language side by side, the primary one first and
 * marked as such. A missing optional language falls back to the primary text on
 * the public site, which the placeholder shows.
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
  // Primary language first, whatever order the setting happens to hold.
  const ordered = [primaryLocale, ...locales.filter((code) => code !== primaryLocale)];

  return (
    <div id={fieldAnchorId("title")} className="scroll-mt-28 grid gap-1.5">
      <div className={`grid gap-4 ${ordered.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {ordered.map((code) => (
          <FieldRow
            key={code}
            anchor={code === primaryLocale ? "title_primary" : undefined}
            label={`${t("admin.listings.fields.title")} · ${code.toUpperCase()} · ${
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
      <p className="text-xs text-muted-foreground">{t("admin.listings.placement.title")}</p>
    </div>
  );
}
