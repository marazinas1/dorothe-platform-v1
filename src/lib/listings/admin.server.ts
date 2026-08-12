// Server-only helpers for admin listing mutations: ownership assertion and
// form -> row mapping. Never imported by client components directly.
import type { SupabaseClient } from "@supabase/supabase-js";

import { pruneTranslations, type ListingFormParsed } from "./admin-schema";

/**
 * Editing is either global (listing.edit.any) or scoped to own listings
 * (listing.edit.own AND agent_id/created_by = auth.uid()).
 */
export async function assertCanEditListing(
  supabase: SupabaseClient,
  userId: string,
  listingId: string,
): Promise<void> {
  const { data: canAny } = await supabase.rpc("current_user_has_permission", {
    _key: "listing.edit.any",
  });
  if (canAny === true) return;

  const { assertPermission } = await import("@/lib/auth/require-permission.server");
  await assertPermission(supabase, userId, "listing.edit.own");

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, agent_id, created_by")
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!listing) throw new Error("Not found");
  if (listing.agent_id !== userId && listing.created_by !== userId) {
    throw new Error("Forbidden");
  }
}

/** Map validated form values onto the listings table shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
/** Mirror the listing's construction year into the energy certificate block. */
function withCertificateYear(
  energy: Record<string, unknown>,
  yearBuilt: number | null,
): Record<string, unknown> {
  if (yearBuilt == null) return energy;
  const current = energy["year_built"];
  if (typeof current === "number" && Number.isFinite(current)) return energy;
  return { ...energy, year_built: yearBuilt };
}

export function toListingRow(data: ListingFormParsed): Record<string, any> {
  const sections = data.content_sections
    .map((section) => ({
      key: section.key,
      items: Object.fromEntries(
        Object.entries(section.items)
          .map(([locale, items]) => [
            locale,
            items.map((i) => i.trim()).filter((i) => i.length > 0),
          ])
          .filter(([, items]) => (items as string[]).length > 0),
      ),
    }))
    .filter((section) => Object.keys(section.items).length > 0);

  return {
    title: pruneTranslations(data.title),
    description: pruneTranslations(data.description),
    meta_title: pruneTranslations(data.meta_title),
    meta_description: pruneTranslations(data.meta_description),
    deal_type: data.deal_type,
    property_type: data.property_type,
    reference_code: data.reference_code,
    features: data.features ?? [],
    condition: data.condition,
    heating_type: data.heating_type,
    price: data.price_on_request ? null : data.price,
    price_on_request: data.price_on_request,
    price_period: data.price_period,
    living_area: data.living_area,
    plot_area: data.plot_area,
    usable_area: data.usable_area,
    rooms: data.rooms,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    floor: data.floor,
    total_floors: data.total_floors,
    year_built: data.year_built,
    year_renovated: data.year_renovated,
    address_street: data.address_street,
    address_number: data.address_number,
    address_zip: data.address_zip,
    address_city: data.address_city,
    address_region: data.address_region,
    address_country: data.address_country,
    geo_lat: data.geo_lat,
    geo_lng: data.geo_lng,
    geo_precision: data.geo_precision,
    service_charge: data.service_charge,
    utilities_cost: data.utilities_cost,
    heating_costs_included: data.heating_costs_included,
    deposit: data.deposit,
    commission_value: data.commission_free ? null : data.commission_value,
    commission_free: data.commission_free,
    commission_type: data.commission_type,
    commission_payer: data.commission_payer,
    rental_status: data.rental_status,
    availability_date: data.availability_date,
    energy_exemption: data.energy_exemption,
    // The DE energy certificate needs its own construction year. When the
    // broker filled the listing's year built, reuse it instead of asking twice.
    energy: withCertificateYear(data.energy ?? {}, data.year_built ?? null),
    content_sections: sections,
  };
}
