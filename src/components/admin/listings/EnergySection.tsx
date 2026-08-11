import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import {
  EFFICIENCY_CLASS_AT,
  EFFICIENCY_CLASS_DE,
  ENERGY_EXEMPTIONS,
  isEnergyExempt,
  validateEnergy,
  type Country,
} from "@/lib/validation/energy";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

type Field =
  | { key: string; kind: "number" }
  | { key: string; kind: "text" }
  | { key: string; kind: "select"; options: readonly string[] };

const AT_FIELDS: Field[] = [
  { key: "hwb", kind: "number" },
  { key: "eeb", kind: "number" },
  { key: "fgee", kind: "number" },
  { key: "efficiency_class", kind: "select", options: EFFICIENCY_CLASS_AT },
];

const DE_FIELDS: Field[] = [
  {
    key: "certificate_type",
    kind: "select",
    options: ["Bedarfsausweis", "Verbrauchsausweis"],
  },
  { key: "final_energy", kind: "number" },
  { key: "energy_source", kind: "text" },
  { key: "efficiency_class", kind: "select", options: EFFICIENCY_CLASS_DE },
  { key: "year_built", kind: "number" },
];

function fieldsFor(country: Country): Field[] {
  if (country === "AT") return AT_FIELDS;
  if (country === "DE") return DE_FIELDS;
  return [];
}

/**
 * Country-specific energy certificate fields. The database re-validates on
 * publish (listings_validate_energy_on_publish); this mirror only warns early.
 */
export function EnergySection({ form }: { form: ListingFormApi }) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const country = settings.country as Country;
  const fields = fieldsFor(country);
  const energy = (form.values.energy ?? {}) as Record<string, unknown>;

  const exempt = isEnergyExempt(
    form.values.property_type,
    form.values.energy_exemption ?? null,
  );
  const missing = exempt
    ? []
    : validateEnergy(country, energy, form.values.property_type).missing;

  if (fields.length === 0) {
    return (
      <FormSection title={t("admin.listings.sections.energy")}>
        <p className="text-sm text-muted-foreground">
          {t("admin.listings.energy.notRequired", { country })}
        </p>
      </FormSection>
    );
  }

  return (
    <FormSection
      title={t("admin.listings.sections.energy")}
      description={t("admin.listings.energy.intro", { country })}
    >
      <div className="mb-4 max-w-sm">
        <FieldRow
          label={t("admin.listings.energy.exemptionLabel")}
          help={t("admin.listings.energy.exemptionHelp")}
        >
          <Select
            value={form.values.energy_exemption ?? "none"}
            onValueChange={(v) =>
              form.setField(
                "energy_exemption",
                v === "none" ? null : (v as (typeof ENERGY_EXEMPTIONS)[number]),
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t("admin.listings.energy.exemptions.none")}
              </SelectItem>
              {ENERGY_EXEMPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`admin.listings.energy.exemptions.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      {exempt ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("admin.listings.checklist.energyExempt")}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = energy[field.key];
          const invalid = !exempt && missing.includes(field.key);
          return (
            <FieldRow
              key={field.key}
              label={t(`admin.listings.energyFields.${field.key}`)}
              error={invalid ? t("admin.listings.energy.required") : undefined}
            >
              {field.kind === "select" ? (
                <Select
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(v) => form.setEnergyField(field.key, v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.kind === "number" ? "number" : "text"}
                  step={field.kind === "number" ? "0.01" : undefined}
                  value={value === undefined || value === null ? "" : String(value)}
                  onChange={(e) =>
                    form.setEnergyField(
                      field.key,
                      field.kind === "number"
                        ? e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                        : e.target.value,
                    )
                  }
                />
              )}
            </FieldRow>
          );
        })}
      </div>
    </FormSection>
  );
}
