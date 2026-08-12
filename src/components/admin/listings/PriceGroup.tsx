import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
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
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow } from "./FieldRow";

/**
 * Price and, where the property type calls for it, the monthly service charge.
 * `showServiceCharge` is decided by field-visibility, not here.
 */
export function PriceGroup({
  form,
  showServiceCharge = true,
}: {
  form: ListingFormApi;
  showServiceCharge?: boolean;
}) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const { values } = form;
  const symbol = currencySymbol(settings.currency);

  const money = (key: "price" | "service_charge") =>
    values[key] === null || values[key] === undefined ? "" : String(values[key]);

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
          <FieldRow label={t("admin.listings.fields.price")}>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background pl-3 focus-within:ring-1 focus-within:ring-ring">
              <span className="text-sm text-muted-foreground">{symbol}</span>
              <Input
                type="number"
                inputMode="decimal"
                className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                value={money("price")}
                onChange={(e) =>
                  form.setField("price", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
          </FieldRow>
          {values.deal_type === "rent" ? (
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
        </div>
      ) : null}

      {showServiceCharge ? (
      <FieldRow
        label={t("admin.listings.fields.service_charge")}
        help={t("admin.listings.help.service_charge")}
        className="max-w-sm"
      >
        <div className="flex items-center gap-2 rounded-md border border-input bg-background pl-3 focus-within:ring-1 focus-within:ring-ring">
          <span className="text-sm text-muted-foreground">{symbol}</span>
          <Input
            type="number"
            inputMode="decimal"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={money("service_charge")}
            onChange={(e) =>
              form.setField(
                "service_charge",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
      </FieldRow>
      ) : null}
    </div>
  );
}
