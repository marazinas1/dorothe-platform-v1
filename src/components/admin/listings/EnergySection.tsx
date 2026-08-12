import { useTranslation } from "react-i18next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { ENERGY_SOURCES, readEnergySources } from "@/lib/listings/vocabularies";
import {
  EFFICIENCY_CLASS_AT,
  EFFICIENCY_CLASS_DE,
  ENERGY_EXEMPTIONS,
  isEnergyExempt,
  type Country,
} from "@/lib/validation/energy";
import type { ListingFormApi } from "./listing-form-state";
import { FieldRow, FormSection } from "./FieldRow";

type Field =
  | { key: string; kind: "number" }
  | { key: string; kind: "sources" }
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
  { key: "energy_source", kind: "sources" },
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
  const sources = readEnergySources(energy);

  function toggleSource(key: string, checked: boolean) {
    const next = checked ? [...sources, key] : sources.filter((s) => s !== key);
    form.setEnergyField("energy_source", next.length > 0 ? next : null);
  }


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
      anchor="energy"
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
      {/* No red "required" hints here: the checklist above the form is the one
          signal for what publishing still needs. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = energy[field.key];
          return (
            <FieldRow
              key={field.key}
              anchor={`energy_${field.key}`}
              label={t(`admin.listings.energyFields.${field.key}`)}
              className={field.kind === "sources" ? "sm:col-span-2" : undefined}
            >
              {field.kind === "sources" ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ENERGY_SOURCES.map((key) => (
                    <label
                      key={key}
                      htmlFor={`energy-source-${key}`}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        id={`energy-source-${key}`}
                        checked={sources.includes(key)}
                        onCheckedChange={(checked) => toggleSource(key, checked === true)}
                      />
                      {t(`listings.energySource.${key}`)}
                    </label>
                  ))}
                </div>
              ) : field.kind === "select" ? (
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
                  type="number"
                  step="0.01"
                  value={value === undefined || value === null ? "" : String(value)}
                  onChange={(e) =>
                    form.setEnergyField(
                      field.key,
                      e.target.value === "" ? "" : Number(e.target.value),
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
