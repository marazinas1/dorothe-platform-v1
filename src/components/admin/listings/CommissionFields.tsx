import { useTranslation } from "react-i18next";

import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { COMMISSION_PAYERS, COMMISSION_TYPES } from "@/lib/listings/admin-schema";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";
import { MoneyField } from "./MoneyField";

/**
 * Commission sits with the price because in the German market it is part of the
 * price statement and is legally expected on a published listing. "Provisionsfrei"
 * is an explicit answer, not an empty field — the publish checklist accepts
 * either a figure or that flag.
 */
export function CommissionFields({
  form,
  symbol,
}: {
  form: ListingFormApi;
  symbol: string;
}) {
  const { t } = useTranslation();
  const { values } = form;
  const free = !!values.commission_free;

  return (
    <div className="grid gap-4 rounded-md border border-border p-3" >
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>
          <span className="font-medium">{t("admin.listings.fields.commission_free")}</span>
          <span className="block text-xs text-muted-foreground">
            {t("admin.listings.help.commission_free")}
          </span>
        </span>
        <Switch
          checked={free}
          onCheckedChange={(checked) => {
            form.setField("commission_free", checked);
            // A commission-free listing keeps no figure behind the toggle.
            if (checked) {
              form.setField("commission_value", null);
              form.setField("commission_type", null);
              form.setField("commission_payer", null);
            }
          }}
        />
      </label>

      {!free ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {values.commission_type === "percent" ? (
            <FieldRow
              label={t("admin.listings.fields.commission_value_percent")}
              anchor="commission"
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
          ) : (
            <MoneyField
              label={t("admin.listings.fields.commission_value")}
              symbol={symbol}
              anchor="commission"
              value={values.commission_value}
              onChange={(v) => form.setField("commission_value", v)}
            />
          )}

          <FieldRow label={t("admin.listings.fields.commission_type")}>
            <Select
              value={values.commission_type ?? "none"}
              onValueChange={(v) =>
                form.setField(
                  "commission_type",
                  v === "none" ? null : (v as (typeof COMMISSION_TYPES)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.listings.notSet")}</SelectItem>
                {COMMISSION_TYPES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`admin.listings.commissionType.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow label={t("admin.listings.fields.commission_payer")}>
            <Select
              value={values.commission_payer ?? "none"}
              onValueChange={(v) =>
                form.setField(
                  "commission_payer",
                  v === "none" ? null : (v as (typeof COMMISSION_PAYERS)[number]),
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("admin.listings.notSet")}</SelectItem>
                {COMMISSION_PAYERS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`admin.listings.commissionPayer.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      ) : null}
    </div>
  );
}
