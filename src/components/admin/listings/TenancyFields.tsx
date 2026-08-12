import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { FALLBACK_LOCALE } from "@/i18n/config";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RENTAL_STATUSES } from "@/lib/listings/admin-schema";
import { fieldLevel, type FieldLevel, type ListingShape } from "@/lib/listings/field-visibility";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

const UNSET = "unset";

/**
 * Availability and tenancy. Rendered at whichever level the field sits: for a
 * rental "available from" is a headline fact next to the price, for a sale it is
 * a detail. Rental status is deliberately independent of deal_type — a property
 * can be for sale AND currently let, which makes it an investment property.
 */
export function TenancyFields({
  form,
  level,
}: {
  form: ListingFormApi;
  level: FieldLevel;
}) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  // The echoed date is listing content — it previews what a visitor reads — so
  // it follows the site locale, not the operator's interface language.
  const contentLocale = settings.default_locale ?? FALLBACK_LOCALE;
  const { values } = form;
  const shape: ListingShape = {
    property_type: values.property_type,
    deal_type: values.deal_type,
  };
  const showAvailability = fieldLevel(shape, "availability_date") === level;
  const showRentalStatus = fieldLevel(shape, "rental_status") === level;
  const investment = values.deal_type === "sale" && values.rental_status === "let";
  if (!showAvailability && !showRentalStatus) return null;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {showAvailability ? (
          <FieldRow
            label={t("admin.listings.fields.availability_date")}
            help={
              values.availability_date
                ? new Intl.DateTimeFormat(contentLocale, { dateStyle: "long" }).format(
                    new Date(values.availability_date),
                  )
                : t("admin.listings.help.availability_date")
            }
          >
            <Input
              type="date"
              value={values.availability_date ?? ""}
              onChange={(e) => form.setField("availability_date", e.target.value || null)}
            />
          </FieldRow>
        ) : null}

        {showRentalStatus ? (
          <FieldRow
            label={t("admin.listings.fields.rental_status")}
            help={t("admin.listings.help.rental")}
          >
            <Select
              value={values.rental_status ?? UNSET}
              onValueChange={(v) =>
                form.setField(
                  "rental_status",
                  v === UNSET ? null : (v as (typeof RENTAL_STATUSES)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>{t("admin.listings.rentalStatus.unset")}</SelectItem>
                {RENTAL_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.listings.rentalStatus.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        ) : null}
      </div>

      {investment && showRentalStatus ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {t("admin.listings.investmentNote")}
        </p>
      ) : null}
    </div>
  );
}
