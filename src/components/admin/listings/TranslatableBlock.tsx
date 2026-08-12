import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EDITABLE_CONTENT_SECTIONS } from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

/** First non-empty value from another language, so one language is enough. */
function fallback(map: Record<string, string> | undefined, lang: string) {
  for (const [code, value] of Object.entries(map ?? {})) {
    if (code !== lang && typeof value === "string" && value.trim()) {
      return { code, value: value.trim() };
    }
  }
  return null;
}

function fallbackItems(items: Record<string, string[]> | undefined, lang: string) {
  for (const [code, value] of Object.entries(items ?? {})) {
    if (code !== lang && Array.isArray(value) && value.some((v) => v.trim())) {
      return { code, value: value.filter((v) => v.trim()) };
    }
  }
  return null;
}

/**
 * Every field that needs a language, grouped in one clearly marked block with
 * the language tabs on it — so it is obvious that everything outside this block
 * is entered once. The site's primary language is marked as such and the others
 * as optional: when a language is empty the primary text is shown to visitors,
 * so publishing in one language stays a supported path.
 */
export function TranslatableBlock({
  form,
  lang,
  locales,
  primaryLocale,
  onLangChange,
}: {
  form: ListingFormApi;
  lang: string;
  locales: string[];
  primaryLocale: string;
  onLangChange: (lang: string) => void;
}) {
  const { t } = useTranslation();
  const { values } = form;

  const titleFb = fallback(values.title, lang);
  const descFb = fallback(values.description, lang);

  function itemsFor(key: string): string[] {
    return (values.content_sections ?? []).find((s) => s.key === key)?.items?.[lang] ?? [];
  }

  function itemsFallback(key: string) {
    const section = (values.content_sections ?? []).find((s) => s.key === key);
    return fallbackItems(section?.items as Record<string, string[]> | undefined, lang);
  }

  return (
    <FormSection
      title={t("admin.listings.sections.translated")}
      description={t("admin.listings.help.translated")}
    >
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {t("admin.listings.contentLanguage")}
          </span>
          <Tabs value={lang} onValueChange={onLangChange}>
            <TabsList>
              {locales.map((code) => (
                <TabsTrigger key={code} value={code}>
                  {code.toUpperCase()}
                  <span className="ml-1.5 text-[10px] font-normal normal-case text-muted-foreground">
                    {code === primaryLocale
                      ? t("admin.listings.localePrimary")
                      : t("admin.listings.localeOptional")}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {t("admin.listings.localeFallbackNote", {
              locale: primaryLocale.toUpperCase(),
            })}
          </p>
        </div>


        <FieldRow
          label={t("admin.listings.fields.title")}
          help={
            titleFb && !values.title?.[lang]?.trim()
              ? t("admin.listings.fallbackFrom", { lang: titleFb.code.toUpperCase() })
              : undefined
          }
        >
          <Input
            value={values.title?.[lang] ?? ""}
            placeholder={titleFb?.value ?? ""}
            onChange={(e) => form.setTranslated("title", lang, e.target.value)}
          />
        </FieldRow>

        <FieldRow
          label={t("admin.listings.fields.description")}
          help={
            descFb && !values.description?.[lang]?.trim()
              ? t("admin.listings.fallbackFrom", { lang: descFb.code.toUpperCase() })
              : undefined
          }
        >
          <Textarea
            rows={6}
            value={values.description?.[lang] ?? ""}
            placeholder={descFb?.value ?? ""}
            onChange={(e) => form.setTranslated("description", lang, e.target.value)}
          />
        </FieldRow>

        {EDITABLE_CONTENT_SECTIONS.map((key) => {
          const fb = itemsFallback(key);
          const current = itemsFor(key);
          return (
            <FieldRow
              key={key}
              label={t(`listings.detail.sections.${key}`)}
              help={
                fb && current.every((v) => !v.trim())
                  ? t("admin.listings.fallbackFrom", { lang: fb.code.toUpperCase() })
                  : t(`admin.listings.help.${key}`)
              }
            >
              <Textarea
                rows={4}
                value={current.join("\n")}
                placeholder={fb?.value.join("\n") ?? ""}
                onChange={(e) => form.setSectionItems(key, lang, e.target.value.split("\n"))}
              />
            </FieldRow>
          );
        })}
      </div>
    </FormSection>
  );
}
