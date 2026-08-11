# Listing form: rebuild for how a broker actually works

## 1. Broken things

**Missing translation keys.** Confirmed: `admin.listings.deal.*`, `admin.listings.propertyType.*` and `admin.listings.help.meta` do not exist in either `en.json` or `de.json`, so the raw key renders. `en.json` and `de.json` are otherwise key-identical (308 admin keys each, no drift).

Fix: add the missing keys plus every key the rebuilt form needs, in both files, and add a check that walks all `t("...")` literals in `src/components/admin` and `src/lib` and fails if any key is absent from either file. That check becomes the guard against raw keys reappearing.

**DE/EN toggle does nothing.** The admin toggle builds a link from the raw pathname (`/$locale/admin/listings/new`) as a single string, which the router cannot match, so the click is a no-op. Fix: switch language by navigating to the current matched route with `params: { locale }` (using the router's current match, not a hand-built string), so the whole interface — labels, help text, dropdown options, validation messages, toasts — re-renders in the chosen language.

**Two language controls, clearly separated.** They are different things and will be labelled and styled differently:

- Interface language (admin header, EN/DE pill): "Interface" / "Oberfläche".
- Content language (inside the form, above the translated fields): "Editing content in …" / "Inhalt bearbeiten in …", styled as a tab strip, not a pill.

**Photos blocked until save → silent auto-draft.** Opening "New listing" immediately creates a draft row server-side (status `draft`, empty title, defaults from `site_settings`) and replaces the URL with the edit route for that id. The upload area is live from the first second.

Junk prevention:
- The auto-draft is marked as provisional (a `created_from_autodraft` flag on the row, cleared on the first real save).
- A cleanup server function deletes provisional drafts older than 24 hours that have no title, no description, no price, no address and no images. It runs opportunistically when the admin listings screen loads (cheap, indexed, permission-checked) — no external scheduler needed.
- Provisional-but-empty drafts are hidden from the listings grid until they have content, so the broker never sees the junk either.

## 2. Form order

1. Photos (cover selectable)
2. Basics — deal type, property type, title, description
3. Location — address + map
4. Figures & price
5. Content sections
6. Energy certificate
7. SEO — collapsed accordion at the bottom

## 3. Usability

**Automatic geocoding (Nominatim).** After street/zip/city are filled (debounced, on blur), a server function queries Nominatim with a proper identifying User-Agent and returns lat/lng plus the matched display name. The pin shows on a small map built from the existing MapLibre/CARTO components, and the broker can drag it to correct the position — dragging writes lat/lng and switches the source to "manual". Raw lat/lng stay visible but read-only until "Edit manually" is clicked.

Provider is a single swappable function (`geocodeAddress` in one file) with a provider-agnostic input/output contract, so switching services later is a one-file change.

Failure handling, all non-blocking:
- No result: a neutral note "Address not found — drag the pin or enter coordinates manually", the map centres on the city (or the configured site coordinates), and the manual fields unlock.
- Rate limited (429) or throttled: treated exactly like any other failure — no error styling, no scary wording, just the manual-pin fallback and a retry button. Requests are debounced and serialised (max one in flight, minimum one second apart) to stay inside Nominatim's limit.
- Request error or timeout: same note, retry button. Never blocks saving or publishing.
- Geocoding is skipped entirely when the broker has set coordinates manually.

**Publish checklist replaces the red warning.** A persistent panel (neutral tokens, not red) lists what is still missing: title, at least one photo, price or "price on request", address city, and the energy fields required for `site_settings.country`. Items tick off live as fields fill. It is informational on a draft; the publish button stays enabled and reports the server's reason if the database refuses.

Energy exemptions: the checklist derives its energy requirement from the same shared rule set the database validation uses (`validate_listing_energy` / `src/lib/validation/energy.ts`), so the two can never disagree. Land and garages are exempt today; the rule set is extended so further GEG exemptions (listed building, new build with certificate pending) can be flagged on the listing. When an exemption applies the checklist states it explicitly ("No Energieausweis required for this property type / exemption noted") rather than falling silent.


**Autosave + sticky bar.** Autosave fires on field blur and on a periodic timer while dirty, with a quiet "Saved HH:MM" indicator. Autosave writes content fields only — it never touches `status`, so it can never publish, unpublish or trip the publish triggers. Publish validation runs only on the explicit publish action, where the database's status-flow, publish-permission and energy triggers are authoritative and their message is surfaced inline. A save/publish bar is fixed to the bottom of the form.

**Defaults.** Country and region prefilled from `site_settings`; energy fields shown per `site_settings.country`; address visibility defaults to approximate.

## 4. German-market fields

- **Hausgeld / monthly service charge** — figure, shown for apartment-type properties.
- **Provision / commission** — value plus type (percent or amount) plus who pays (buyer / seller / shared).
- **Rental status** — currently let (Kapitalanlage) or vacant, with the existing available-from date surfaced next to it.

Added to the migration, the shared schema, the form, and the public detail facts area (respecting the existing "commission note public" switch for the commission line).

## 5. Upload area copy

Above the drop zone, in both languages: drag files here or click to select; photos are optimised automatically — resized, converted to modern formats, location data removed; mark one as the cover image.

## Technical notes

- Migration: new `listings` columns (`service_charge`, `commission_value`, `commission_type`, `commission_payer`, `rental_status`, `created_from_autodraft`) with defaults and grants; `listings_public` view extended so the public page can read the new facts.
- Core additions in `/lib`: `src/lib/geo/geocode.functions.ts` (Nominatim lookup), autodraft create + cleanup in `src/lib/listings/admin-mutations.functions.ts`, checklist logic in `src/lib/listings/publish-checklist.ts` (pure, shared by form and future callers).
- Form composition split so every file stays under 200 lines: `ListingForm.tsx` becomes a thin ordered composition; new `PhotosSection`, `PricingSection` additions, `SeoSection` (collapsed), `PublishChecklist`, `StickySaveBar`, `AddressMapPicker`; autosave lives in a `use-listing-autosave.ts` hook.
- All strings in `src/messages/*.json`; all colours and radii from existing tokens; the map reuses the GDPR-friendly CARTO setup, loaded client-only.
