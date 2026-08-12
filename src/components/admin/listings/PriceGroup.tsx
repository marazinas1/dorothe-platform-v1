import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { PRICE_PERIODS } from "@/lib/listings/admin-schema";
import { currencySymbol } from "@/lib/listings/format";
import { isOpen, type ListingShape } from "@/lib/listings/field-visibility";
import { moneyLabelKey } from "@/lib/listings/field-labels";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";
import { MoneyField } from "./MoneyField";
import { CommissionFields } from "./CommissionFields";

/**
 * The money block. Which figures appear, and what the price is called, both come
 * from the listing's deal type via field-visibility — a sale asks for Kaufpreis
 * and Hausgeld, a rental for Kaltmiete, Nebenkosten, Warmmiete and Kaution.
 */
export function PriceGroup({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { values } = form;
  const symbol = currencySymbol(settings.currency);
  const shape: ListingShape = {
    property_type: values.property_type,
    deal_type: values.deal_type,
  };

  // Warmmiete is computed by the database; shown here read-only so the broker
  // sees the number a tenant will compare, without a second place to edit it.
  const totalRent =
    values.price != null || values.utilities_cost != null
      ? Number(values.price ?? 0) + Number(values.utilities_cost ?? 0)
      : null;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <div>
          <div className="text-sm font-medium">
            {t("admin.listings.fields.price_on_request")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("admin.listings.help.price_on_request")}
          </p>
        </div>
        <Switch
          checked={!!values.price_on_request}
          onCheckedChange={(checked) => form.setField("price_on_request", checked)}
        />
      </div>

      {!values.price_on_request ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            label={t(moneyLabelKey(shape, "price"))}
            symbol={symbol}
            anchor="price"
            value={values.price}
            onChange={(v) => form.setField("price", v)}
          />

          {isOpen(shape, "price_period") ? (
            <FieldRow
              label={t("admin.listings.fields.price_period")}
              help={t("admin.listings.help.price_period")}
            >
              <Select
                value={values.price_period ?? "none"}
                onValueChange={(v) =>
                  form.setField(
                    "price_period",
                    v === "none" ? null : (v as (typeof PRICE_PERIODS)[number]),
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("admin.listings.notSet")}</SelectItem>
                  {PRICE_PERIODS.map((period) => (
                    <SelectItem key={period} value={period}>
                      {t(`admin.listings.pricePeriod.${period}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          ) : null}

          {isOpen(shape, "service_charge") ? (
            <MoneyField
              label={t(moneyLabelKey(shape, "service_charge"))}
              help={t("admin.listings.help.service_charge")}
              symbol={symbol}
              value={values.service_charge}
              onChange={(v) => form.setField("service_charge", v)}
            />
          ) : null}

          {isOpen(shape, "utilities_cost") ? (
            <MoneyField
              label={t(moneyLabelKey(shape, "utilities_cost"))}
              help={t("admin.listings.help.utilities_cost")}
              symbol={symbol}
              value={values.utilities_cost}
              onChange={(v) => form.setField("utilities_cost", v)}
            />
          ) : null}

          {isOpen(shape, "total_rent") ? (
            <MoneyField
              label={t("admin.listings.fields.total_rent")}
              help={t("admin.listings.help.total_rent")}
              symbol={symbol}
              value={totalRent}
              onChange={() => undefined}
              readOnly
            />
          ) : null}

          {isOpen(shape, "deposit") ? (
            <MoneyField
              label={t(moneyLabelKey(shape, "deposit"))}
              help={t("admin.listings.help.deposit")}
              symbol={symbol}
              value={values.deposit}
              onChange={(v) => form.setField("deposit", v)}
            />
          ) : null}
        </div>
      ) : null}

      {isOpen(shape, "heating_costs_included") ? (
        <label className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2 text-sm">
          <span>{t("admin.listings.fields.heating_costs_included")}</span>
          <Switch
            checked={!!values.heating_costs_included}
            onCheckedChange={(checked) => form.setField("heating_costs_included", checked)}
          />
        </label>
      ) : null}

      {isOpen(shape, "commission") ? <CommissionFields form={form} symbol={symbol} /> : null}
    </div>
  );
}
