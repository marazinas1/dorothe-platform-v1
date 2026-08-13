import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { listingPath, slugIssue, slugifyText } from "@/lib/listings/slug";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

/**
 * Manual web address. While a listing has never been public the slug follows
 * the title automatically, so the field is informational; once it has been
 * public the address is frozen and changing it has to be acknowledged, because
 * every link already shared would stop working.
 */
export function SlugField({
  form,
  publishedEver,
}: {
  form: ListingFormApi;
  publishedEver: boolean;
}) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const [unlocked, setUnlocked] = useState(false);

  const raw = (form.values.slug as string | null) ?? "";
  const issue = raw.trim() === "" ? null : slugIssue(raw, settings.enabled_locales);
  const locale = settings.default_locale;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const preview = `${origin}${listingPath(locale, slugifyText(raw) || "…")}`;
  const locked = publishedEver && !unlocked;

  return (
    <FieldRow
      label={t("admin.listings.fields.slug")}
      help={publishedEver ? undefined : t("admin.listings.help.slugFollowsTitle")}
      error={issue ? t(`admin.listings.errors.${issue}`) : undefined}
      anchor="slug"
    >
      <Input
        value={raw}
        disabled={locked}
        spellCheck={false}
        onChange={(e) => form.setField("slug", e.target.value)}
        onBlur={() => form.setField("slug", slugifyText(raw) || null)}
      />
      <p className="break-all text-xs text-muted-foreground">{preview}</p>
      {locked ? (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            {t("admin.listings.help.slugFrozen")}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setUnlocked(true)}
          >
            {t("admin.listings.slugUnlock")}
          </Button>
        </div>
      ) : publishedEver ? (
        <p className="text-xs text-destructive">{t("admin.listings.help.slugWarning")}</p>
      ) : null}
    </FieldRow>
  );
}
