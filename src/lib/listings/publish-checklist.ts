// Publish readiness, derived from the same rules the database enforces on
// publish (listings_validate_energy_on_publish + the not-null expectations of
// the public view). Shown as a neutral, persistent checklist rather than as
// red validation errors, because a draft is allowed to be incomplete.
import type { ListingFormValues } from "./admin-schema";
import { applies } from "./field-visibility";
import { isEnergyExempt, validateEnergy, type Country } from "@/lib/validation/energy";

export type ChecklistKey = "title" | "photo" | "price" | "city" | "commission" | "energy";

export type ChecklistItem = {
  key: ChecklistKey;
  done: boolean;
  /** Set when the requirement does not apply to this listing at all. */
  exempt?: boolean;
  /** Field keys still missing, when the item can name them. */
  missing?: string[];
  /**
   * Field anchor the rail scrolls to. Energy items point at the individual
   * energy field, so "year built (certificate)" never lands on the property one.
   */
  anchor: string;
};

export type Checklist = {
  items: ChecklistItem[];
  outstanding: number;
  ready: boolean;
  energyExempt: boolean;
};

function hasAnyTranslation(value: Record<string, string> | undefined): boolean {
  return Object.values(value ?? {}).some((v) => typeof v === "string" && v.trim().length > 0);
}

export function buildPublishChecklist({
  values,
  imageCount,
  country,
}: {
  values: ListingFormValues;
  imageCount: number;
  country: Country;
}): Checklist {
  const shape = { property_type: values.property_type, deal_type: values.deal_type };

  // A type that has no energy fields at all can never owe an energy certificate,
  // so the checklist and the form agree on one visibility source.
  const energyExempt =
    !applies(shape, "energy") ||
    isEnergyExempt(values.property_type, values.energy_exemption ?? null);
  const energyMissing = energyExempt
    ? []
    : validateEnergy(
        country,
        (values.energy ?? {}) as Record<string, unknown>,
        values.property_type,
      ).missing;

  // Commission: entering a figure OR marking the listing commission-free are both
  // valid answers. An untouched field is not.
  const commissionAnswered =
    values.commission_free === true ||
    (values.commission_value != null && Number(values.commission_value) > 0);

  const items: ChecklistItem[] = [
    { key: "title", done: hasAnyTranslation(values.title), anchor: "title" },
    { key: "photo", done: imageCount > 0, anchor: "photos" },
    {
      key: "price",
      done: !!values.price_on_request || (values.price != null && Number(values.price) > 0),
      anchor: "price",
    },
    { key: "city", done: !!values.address_city?.trim(), anchor: "address_city" },
    {
      key: "commission",
      done: commissionAnswered,
      exempt: !applies(shape, "commission"),
      anchor: "commission",
    },
    {
      key: "energy",
      done: energyMissing.length === 0,
      exempt: energyExempt,
      missing: energyMissing,
      anchor: energyMissing.length > 0 ? `energy_${energyMissing[0]}` : "energy",
    },
  ].filter((item) => !(item.exempt && item.key === "commission"));

  const outstanding = items.filter((i) => !i.done).length;
  return { items, outstanding, ready: outstanding === 0, energyExempt };
}
