# Listing form: equipment, condition, heating, constrained choices, reordering

Verified against the code: `listings` already has `features text[]`, `condition text`, `heating_type text` and `reference_code text`, and the public listing type already carries all four — but none of them are in the admin form or on the detail page, which is why the public feature filters have nothing to work with. `condition` currently has a database check constraint limited to four English values (`new`, `renovated`, `good`, `needs_renovation`), so the seven German-standard values need a schema change. `energy_source` is a free text field today and the publish validation only checks that it is a non-empty string.

## 1. Database (one migration, core)

- Replace the `condition` check constraint with the seven standard values, stored as stable English keys: `first_occupancy`, `like_new`, `renovated`, `modernised`, `well_kept`, `needs_renovation`, `for_demolition`. Existing values are mapped (`new` to `first_occupancy`, `good` to `well_kept`, others one-to-one).
- Keep `heating_type` free-form in the column but constrain it in the app to the nine standard keys, validated by trigger so portal export stays clean.
- Allow `energy.energy_source` to be an array of keys and make the publish validation require at least one non-empty entry (today an empty array would slip through).
- No new columns: `features`, `condition`, `heating_type`, `reference_code` all exist.

## 2. Shared vocabularies (core)

New `src/lib/listings/vocabularies.ts` holding stable English keys with per-property-type applicability:

- Features: balcony, terrace, garden, cellar, lift, garage, parking_space, underground_parking, fitted_kitchen, guest_wc, barrier_free, underfloor_heating, fireplace, attic, storage_room. Each key declares which property types it applies to, so a plot never offers a lift.
- Condition: the seven keys above.
- Heating: central, floor_level, underfloor, district, gas, oil, heat_pump, pellet, night_storage.
- Energy sources: district_heating, natural_gas, lpg, heating_oil, electricity, heat_pump, wood_pellets, solar, geothermal, chp.
- German federal states for the region dropdown, and the country list for the country dropdown.

Labels live only in `de.json` / `en.json`; nothing user-visible in code.

## 3. Admin form changes

- New `FeaturesSection`: checkbox grid filtered by the selected property type; deselects keys that stop applying when the type changes.
- New fields in an "Equipment" group: condition dropdown, heating dropdown.
- Energy: `energy_source` becomes a multi-select of the standard keys (chips or a checkbox popover), stored as an array.
- Location: country becomes a dropdown defaulting from settings; region becomes a dropdown of federal states when the country is Germany, prefilled from settings, and stays a text input for other countries.
- Remove the red "Required before publishing" text under energy fields. The checklist at the top is the only required-field signal; field-level hints stay neutral grey and only show on the field being edited.
- Checklist markers change from circle/check icons that read as radio buttons to non-interactive markers (a small dash for outstanding, a check for done) on a plain list.
- Order becomes: Basics, Photos, Location, Figures, Equipment and features, Market, Content, Energy, SEO (collapsed).
- Empty photo area becomes a single slim drop zone that expands into the grid once photos exist.
- Page heading follows the title as typed, falling back to the untitled label.
- New reference number field (`reference_code`) in Basics: optional free text, added to the admin list search, shown as a column/card line, and rendered on the public detail page.
- Figures split into two visually separate groups: price and costs (price, on request, period, service charge, commission) and size and rooms (areas, rooms, bedrooms, bathrooms, floors, years). Price input gets a currency prefix taken from settings, not a hardcoded symbol.
- Availability date: a locale-aware date field so German shows day.month.year, using the interface language.

## 4. Upload area text (both languages)

Written with our real numbers: drag files here or click to select (up to 50 at once); each photo is optimised automatically into AVIF and WebP at 400, 1200 and 2400 pixels wide plus a 1200x630 social preview; location and camera metadata is stripped; the original is kept privately and never published; mark one photo as the cover.

## 5. Public detail page

`ListingFactsBar` gains condition and heating rows, and a new brand component renders the features list as a compact grid under the facts. Both use translated labels from the shared vocabulary, so a listing entered once shows correctly in both languages.

## Technical notes

- Every new field flows through the existing `ListingFormSchema`, `toListingRow` and autosave path; publishing stays explicit and unchanged.
- Vocabularies and validation live in `/lib` (core); only the presentational features grid and facts rows are brand-side.
- New sections are separate files to keep every file under 200 lines; `FiguresSection` is split into price and size subcomponents.
- Colours and spacing stay on tokens; no separate admin palette.
