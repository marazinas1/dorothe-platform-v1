# Listing form: short path to publish

One idea drives this: the fields needed to publish a good listing are open on the screen, everything else lives behind one "More details" toggle, and nothing is asked for twice. The publish checklist, autosave, sticky save bar, photos-first order and address-to-map pin stay exactly as they are.

## 1. Property types (aruodas.lt convention)

The picker offers six types: **apartment, house, plot, commercial premises, garage / parking, country house**. Deal type stays sale / rent.

Stored keys: `apartment`, `house`, `land` (labelled "Plot"), `commercial`, `garage`, `country_house`. `land` is kept as the stored key because the database energy exemption and existing listings already use it — only the label changes. `country_house` is new. The legacy keys `villa`, `townhouse`, `penthouse`, `other` stay valid in the database so old rows keep working, but they disappear from the picker; if a listing still holds one, the form shows it as a read-only current value until the broker picks a new type.

### What the broker sees per type

Fields not listed are hidden, not just empty — hidden fields keep any stored value untouched.

| Field | Apartment | House | Plot | Commercial | Garage | Country house |
|---|---|---|---|---|---|---|
| Title, description, photos, address | yes | yes | yes | yes | yes | yes |
| Price, price on request | yes | yes | yes | yes | yes | yes |
| Living area | yes | yes | – | – | – | yes |
| Usable / commercial area (details) | yes | yes | – | yes | yes | yes |
| Plot area | – | details | **yes, open** | details | – | **yes, open** |
| Rooms, bedrooms | yes | yes | – | – | – | yes |
| Bathrooms | yes | yes | – | yes | – | yes |
| Floor / total floors | yes (details) | total floors only (details) | – | yes (details) | – | total floors only (details) |
| Condition | yes | yes | – | yes | yes | yes |
| Heating | yes | yes | – | yes | – | yes |
| Energy certificate | yes | yes | **exempt** | yes | **exempt** | yes |
| Features grid | filtered | filtered | plot-only (parking) | filtered | minimal | filtered |
| Year built / renovated (details) | yes | yes | – | yes | yes | yes |
| Service charge (details) | yes | yes | – | yes | – | yes |
| Commission, tenancy, reference, availability (details) | yes | yes | yes | yes | yes | yes |

Energy exemption for plot and garage is what the database already does, so the publish checklist marks energy "not required" for those instead of blocking publish.

## 2. Two levels

**Open by default:** photos, the translatable block (title, description, highlights), deal type, property type, price, living area, rooms, bedrooms, bathrooms, address with map pin, energy certificate, features grid, condition, heating.

**Behind "More details" (one collapsed section):** plot area, usable area, floor and total floors, year built and renovated, service charge, commission (value, type, payer), tenancy status, reference number, availability date, and SEO title/description.

The section opens automatically when any field inside it already has a value, so nothing is ever hidden from the broker.

## 3. Stop asking twice

`content_sections` keeps only two written blocks:

- **Highlights** — genuine selling points, per language.
- **Location & surroundings** — narrative about the area, per language.

`property_info` and `building_info` are removed from the editor and from the public page. Existing data stays in the database, unrendered.

In their place the public detail page renders a **generated specification block** built from the structured fields (type, rooms, bedrooms, bathrooms, living/plot/usable area, floor of total, year built, year renovated, condition, heating, energy class, service charge, tenancy). It is fully localised from the existing translation keys, so it reads correctly in German and English without anyone typing it twice.

## 4. Bilingual entry

The translatable fields (title, description, highlights, surroundings, and the SEO pair inside details) are grouped into one clearly marked block with the EN/DE tab strip on it. Everything outside that block is entered once and carries no language — that is now visually obvious.

Fallback: when a field is empty in the current language, the public page and the form both fall back to the other language rather than showing nothing. In the form the fallback appears as greyed placeholder text with a note saying which language it came from, so publishing in one language only is a supported path.

## Technical notes

- Migration: extend `listings_property_type_check` with `country_house`; extend the energy-exemption branches in `validate_listing_energy` only where needed (plot and garage are already exempt). No data rewrite.
- `PROPERTY_TYPES` in `src/lib/listings/admin-schema.ts` splits into `SELECTABLE_PROPERTY_TYPES` (the six) and the full accepted set for validation.
- New core module `src/lib/listings/field-visibility.ts`: single source of truth mapping property type to visible fields and to which fields belong to the details level. The form, the publish checklist and the generated specification block all read it, so a type rule is defined once.
- `LISTING_FEATURES` in `vocabularies.ts` gains `country_house` and keeps `pruneFeatures` behaviour on type change.
- New brand component `ListingSpecs.tsx` renders the generated specification block; `ListingContentSections.tsx` narrows to `highlights` and `surroundings`.
- Form structure: `ListingForm.tsx` stays a thin shell — photos, `TranslatableBlock`, essentials sections, then `MoreDetailsSection` wrapping the existing figures/market/SEO groups. Every file stays under 200 lines.
- All new labels and help texts go into `src/messages/en.json` and `de.json`; no client-specific wording anywhere.
