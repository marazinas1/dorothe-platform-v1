import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  siteSettingsQueryOptions,
  updateSiteSettings,
} from "@/lib/config/site-settings.functions";
import {
  GeneralSchema,
  CountrySchema,
  AreaUnitSchema,
} from "@/lib/validation/site-settings";

import { SaveButton } from "./SaveButton";

const COUNTRIES = CountrySchema.options;
const AREA_UNITS = AreaUnitSchema.options;

type Values = {
  site_name: string;
  legal_name: string;
  country: (typeof COUNTRIES)[number];
  default_locale: string;
  enabled_locales: string[];
  service_region: Record<string, string>;
  currency: string;
  area_unit: (typeof AREA_UNITS)[number];
};

export function GeneralTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(siteSettingsQueryOptions);

  const defaults: Values = {
    site_name: data.site_name,
    legal_name: data.legal_name ?? "",
    country: data.country,
    default_locale: data.default_locale,
    enabled_locales: data.enabled_locales,
    service_region: data.service_region ?? {},
    currency: data.currency,
    area_unit: data.area_unit,
  };

  const form = useForm<Values>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(GeneralSchema) as any,
    defaultValues: defaults,
  });

  useEffect(() => {
    form.reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  async function save() {
    const ok = await form.trigger();
    if (!ok) throw new Error("validation");
    const values = form.getValues();
    await updateSiteSettings({ data: { tab: "general", values } });
    await qc.invalidateQueries({ queryKey: siteSettingsQueryOptions.queryKey });
  }

  return (
    <form className="space-y-4 max-w-2xl">
      <Field label={t("admin.settings.general.site_name")} error={form.formState.errors.site_name?.message}>
        <Input {...form.register("site_name")} />
      </Field>
      <Field label={t("admin.settings.general.legal_name")}>
        <Input {...form.register("legal_name")} />
      </Field>
      <Field label={t("admin.settings.general.country")}>
        <Select
          value={form.watch("country")}
          onValueChange={(v) => form.setValue("country", v as Values["country"], { shouldDirty: true })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label={t("admin.settings.general.default_locale")}>
        <Input {...form.register("default_locale")} />
      </Field>
      <Field
        label={t("admin.settings.general.enabled_locales")}
        help={t("admin.settings.general.enabled_locales_help")}
      >
        <Input
          value={form.watch("enabled_locales").join(", ")}
          onChange={(e) =>
            form.setValue(
              "enabled_locales",
              e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              { shouldDirty: true },
            )
          }
        />
      </Field>
      {form.watch("enabled_locales").map((loc) => (
        <Field
          key={loc}
          label={`${t("admin.settings.general.service_region")} (${loc})`}
          help={t("admin.settings.general.service_region_help")}
        >
          <Input
            value={form.watch("service_region")?.[loc] ?? ""}
            onChange={(e) =>
              form.setValue(
                "service_region",
                { ...form.getValues("service_region"), [loc]: e.target.value },
                { shouldDirty: true },
              )
            }
          />
        </Field>
      ))}
      <Field label={t("admin.settings.general.currency")}>
        <Input {...form.register("currency")} />
      </Field>
      <Field label={t("admin.settings.general.area_unit")}>
        <Select
          value={form.watch("area_unit")}
          onValueChange={(v) => form.setValue("area_unit", v as Values["area_unit"], { shouldDirty: true })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {AREA_UNITS.map((u) => (
              <SelectItem key={u} value={u}>{t(`admin.settings.general.${u}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <SaveButton onSubmit={save} />
    </form>
  );
}

function Field({
  label, help, error, children,
}: { label: string; help?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
