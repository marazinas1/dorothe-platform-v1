import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMMISSION_PAYERS,
  COMMISSION_TYPES,
  RENTAL_STATUSES,
} from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

const UNSET = "unset";

/**
 * Costs, commission and tenancy. Rental status is deliberately independent of
 * deal_type: a property can be for sale AND currently let, which is what makes
 * it an investment property rather than a home to move into.
 */
export function MarketSection({ form }: { form: ListingFormApi }) {
  const { t, i18n } = useTranslation();
  const { values } = form;
  const investment = values.deal_type === "sale" && values.rental_status === "let";

  return (
    <FormSection title={t("admin.listings.sections.market")}>
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow
            label={t("admin.listings.fields.availability_date")}
            help={
              values.availability_date
                ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "long" }).format(
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
        </div>


        <div className="grid gap-4 sm:grid-cols-3">
          <FieldRow
            label={t("admin.listings.fields.commission_value")}
            help={t("admin.listings.help.commission")}
          >
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={values.commission_value ?? ""}
              onChange={(e) =>
                form.setField(
                  "commission_value",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
            />
          </FieldRow>
          <FieldRow label={t("admin.listings.fields.commission_type")}>
            <Select
              value={values.commission_type ?? UNSET}
              onValueChange={(v) =>
                form.setField(
                  "commission_type",
                  v === UNSET ? null : (v as (typeof COMMISSION_TYPES)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>{t("admin.listings.rentalStatus.unset")}</SelectItem>
                {COMMISSION_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.listings.commissionType.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label={t("admin.listings.fields.commission_payer")}>
            <Select
              value={values.commission_payer ?? UNSET}
              onValueChange={(v) =>
                form.setField(
                  "commission_payer",
                  v === UNSET ? null : (v as (typeof COMMISSION_PAYERS)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>{t("admin.listings.rentalStatus.unset")}</SelectItem>
                {COMMISSION_PAYERS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`admin.listings.commissionPayer.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>

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

        {investment ? (
          <p className="rounded-md border border-border bg-card px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            {t("admin.listings.investmentNote")}
          </p>
        ) : null}
      </div>
    </FormSection>
  );
}
