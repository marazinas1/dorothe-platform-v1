// Which energy figures a listing must show, decided per country.
//
// This is core, not presentation. The disclosure is a legal obligation and it
// differs per market: Germany discloses the certificate type together with the
// Endenergiebedarf/-verbrauch (GEG §87), Austria discloses HWB and fGEE (EAVG
// §5), Switzerland discloses the GEAK class. A clone of this codebase that
// sells in Austria must keep the Austrian fields, so the country decides the
// shape here — never the component, and never the data that happens to exist.
//
// The country comes from site_settings.country, the same input the publish
// validation uses (public.validate_listing_energy / src/lib/validation/energy).
import { isEnergyExempt, type Country } from "@/lib/validation/energy";
import { readEnergySources } from "./vocabularies";

/** One label/value pair. Values are either formatted literals or i18n keys. */
export type EnergyCell = {
  labelKey: string;
  /** Already formatted for display (numbers with unit, letters, dates). */
  value?: string;
  /** Vocabulary term that has to be translated. */
  valueKey?: string;
  /** Several vocabulary terms, joined by the component. */
  valueKeys?: string[];
};

export type EnergyView =
  /** Property type or a legal exemption means there is nothing to disclose. */
  | { kind: "exempt"; exemptionKey: string | null }
  /** Disclosure is required but the data is not in yet. */
  | { kind: "missing" }
  | {
      kind: "cells";
      cells: EnergyCell[];
      /** Rendered as the large letter grade when the market uses one. */
      efficiencyClass: string | null;
      /** Country-specific footnote, e.g. which standard the figures follow. */
      footnoteKey: string;
    };

const PREFIX = "listings.detail.energy_fields";

/** German certificate types are stored with their legal German names. */
const DE_CERTIFICATE_KEY: Record<string, string> = {
  Bedarfsausweis: "demand",
  Verbrauchsausweis: "consumption",
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function kwh(value: number, locale: string): string {
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    maximumFractionDigits: 1,
  });
  return `${nf.format(value)} kWh/(m²·a)`;
}

function isoDate(value: unknown, locale: string): string | null {
  const raw = str(value);
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "de-DE", {
    dateStyle: "long",
  }).format(d);
}

function germanCells(e: Record<string, unknown>, locale: string): EnergyCell[] {
  const cells: EnergyCell[] = [];
  const certificate = str(e["certificate_type"]);
  const certKey = certificate ? DE_CERTIFICATE_KEY[certificate] : undefined;
  if (certKey) {
    cells.push({ labelKey: `${PREFIX}.certificate_type`, valueKey: `${PREFIX}.certificate.${certKey}` });
  }

  const finalEnergy = num(e["final_energy"]);
  if (finalEnergy != null) {
    // The same number is called Bedarf or Verbrauch depending on the
    // certificate — using one word for both would misstate the document.
    const labelKey =
      certKey === "consumption"
        ? `${PREFIX}.final_energy_consumption`
        : certKey === "demand"
          ? `${PREFIX}.final_energy_demand`
          : `${PREFIX}.final_energy`;
    cells.push({ labelKey, value: kwh(finalEnergy, locale) });
  }

  const sources = readEnergySources(e);
  if (sources.length > 0) {
    cells.push({
      labelKey: `${PREFIX}.energy_source`,
      valueKeys: sources.map((s) => `listings.energySource.${s}`),
    });
  }

  const yearBuilt = num(e["year_built"]);
  if (yearBuilt != null) {
    cells.push({ labelKey: `${PREFIX}.year_built`, value: String(yearBuilt) });
  }

  const issued = isoDate(e["certificate_date"], locale);
  if (issued) cells.push({ labelKey: `${PREFIX}.certificate_date`, value: issued });
  const until = isoDate(e["certificate_valid_until"], locale);
  if (until) cells.push({ labelKey: `${PREFIX}.certificate_valid_until`, value: until });

  return cells;
}

function austrianCells(e: Record<string, unknown>, locale: string): EnergyCell[] {
  const cells: EnergyCell[] = [];
  const hwb = num(e["hwb"]);
  if (hwb != null) cells.push({ labelKey: `${PREFIX}.hwb`, value: kwh(hwb, locale) });
  const eeb = num(e["eeb"]);
  if (eeb != null) cells.push({ labelKey: `${PREFIX}.eeb`, value: kwh(eeb, locale) });
  const fgee = num(e["fgee"]);
  if (fgee != null) {
    const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
      maximumFractionDigits: 2,
    });
    // fGEE is a ratio against the reference building — it carries no unit.
    cells.push({ labelKey: `${PREFIX}.fgee`, value: nf.format(fgee) });
  }
  const issued = isoDate(e["certificate_date"], locale);
  if (issued) cells.push({ labelKey: `${PREFIX}.certificate_date`, value: issued });
  const until = isoDate(e["certificate_valid_until"], locale);
  if (until) cells.push({ labelKey: `${PREFIX}.certificate_valid_until`, value: until });
  return cells;
}

/**
 * Switzerland has no required shape in the schema yet (the validation treats it
 * as passthrough), so whatever comparable figures were entered are shown next
 * to the GEAK class rather than dropped.
 */
function swissCells(e: Record<string, unknown>, locale: string): EnergyCell[] {
  const cells: EnergyCell[] = [];
  const finalEnergy = num(e["final_energy"]);
  if (finalEnergy != null) {
    cells.push({ labelKey: `${PREFIX}.final_energy`, value: kwh(finalEnergy, locale) });
  }
  const issued = isoDate(e["certificate_date"], locale);
  if (issued) cells.push({ labelKey: `${PREFIX}.certificate_date`, value: issued });
  return cells;
}

const FOOTNOTE: Partial<Record<Country, string>> = {
  DE: "listings.detail.energy_note_de",
  AT: "listings.detail.energy_note_at",
  CH: "listings.detail.energy_note_ch",
};

export function energyView(input: {
  country: string;
  energy: unknown;
  propertyType: string;
  exemption?: string | null;
  locale: string;
}): EnergyView {
  const { propertyType, exemption, locale } = input;
  if (isEnergyExempt(propertyType, exemption ?? null)) {
    return { kind: "exempt", exemptionKey: exemption ? `listings.energyExemption.${exemption}` : null };
  }

  const country = (input.country || "").toUpperCase() as Country;
  const e =
    input.energy && typeof input.energy === "object"
      ? (input.energy as Record<string, unknown>)
      : {};

  const cells =
    country === "AT"
      ? austrianCells(e, locale)
      : country === "CH"
        ? swissCells(e, locale)
        : germanCells(e, locale);
  const efficiencyClass = str(e["efficiency_class"]);

  if (cells.length === 0 && !efficiencyClass) return { kind: "missing" };

  return {
    kind: "cells",
    cells,
    efficiencyClass,
    footnoteKey: FOOTNOTE[country] ?? "listings.detail.energy_note_generic",
  };
}
