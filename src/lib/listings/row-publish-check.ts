// Publish readiness for a list row, reusing the editor's checklist so the list
// and the form never disagree about what is missing.
import type { AdminListingRow } from "./admin.functions";
import type { ListingFormValues } from "./admin-schema";
import { buildPublishChecklist, type ChecklistItem } from "./publish-checklist";
import type { Country } from "@/lib/validation/energy";

/** The subset of form values a list row can supply. */
function asFormValues(row: AdminListingRow): ListingFormValues {
  return {
    title: (row.title ?? {}) as Record<string, string>,
    description: {},
    deal_type: row.deal_type as ListingFormValues["deal_type"],
    property_type: row.property_type as ListingFormValues["property_type"],
    price: row.price,
    price_on_request: row.price_on_request ?? false,
    address_city: row.address_city,
    commission_free: row.commission_free ?? false,
    commission_value: row.commission_value,
    energy: (row.energy ?? {}) as Record<string, unknown>,
    energy_exemption: row.energy_exemption as ListingFormValues["energy_exemption"],
  } as ListingFormValues;
}

/** Checklist items still outstanding, in checklist order. */
export function rowPublishBlockers(
  row: AdminListingRow,
  country: Country,
): ChecklistItem[] {
  const { items } = buildPublishChecklist({
    values: asFormValues(row),
    imageCount: (row.images ?? []).length,
    country,
  });
  return items.filter((item) => !item.done);
}
