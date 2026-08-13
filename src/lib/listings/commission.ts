// Commission disclosure. One rule set, because what the row claims is a legal
// statement about who owes money to whom.
//
// German letting follows the Bestellerprinzip (§ 2 Abs. 1a WoVermRG): the agent
// may only charge the party that engaged them, which in residential letting is
// the landlord. A tenant therefore almost never pays commission, and the
// portals state this explicitly — ImmoScout24 and Immowelt both show a rental
// as "provisionsfrei" for the tenant rather than leaving the field blank.
// Silence reads as "unclear", so a rental always renders a commission row.
import type { Locale } from "@/i18n/config";

import { formatPrice } from "./format";

export type CommissionInput = {
  deal_type: string;
  commission_free?: boolean | null;
  commission_value?: number | null;
  commission_type?: string | null;
  commission_payer?: string | null;
};

export type CommissionRow = { labelKey: string; value: string };

type Translate = (key: string, vars?: Record<string, unknown>) => string;

const PREFIX = "listings.detail";

function amount(
  input: CommissionInput,
  currency: string,
  locale: Locale,
): string | null {
  if (input.commission_value == null) return null;
  if (input.commission_type === "amount") {
    return formatPrice(input.commission_value, currency, locale, { onRequestLabel: "" });
  }
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    maximumFractionDigits: 2,
  });
  return `${nf.format(input.commission_value)} %`;
}

/**
 * The row for the public specification. Returns null only for a sale with no
 * commission entered — a rental always states its position.
 */
export function commissionRow(
  input: CommissionInput,
  currency: string,
  locale: Locale,
  t: Translate,
): CommissionRow | null {
  const isRent = input.deal_type === "rent";
  const value = amount(input, currency, locale);
  // The landlord/seller paying is the same thing as the tenant/buyer not paying.
  const freeForCounterparty =
    Boolean(input.commission_free) || input.commission_payer === "seller";

  if (isRent) {
    if (freeForCounterparty || value == null) {
      return {
        labelKey: `${PREFIX}.commission_tenant`,
        value: t(`${PREFIX}.commission_free_tenant`),
      };
    }
    const payer = input.commission_payer
      ? t(`${PREFIX}.commission_payer_rent.${input.commission_payer}`)
      : "";
    return {
      labelKey: `${PREFIX}.commission_tenant`,
      value: [value, payer].filter(Boolean).join(" \u00b7 "),
    };
  }

  if (freeForCounterparty) {
    return {
      labelKey: `${PREFIX}.commission_buyer`,
      value: t(`${PREFIX}.commission_free_buyer`),
    };
  }
  if (value == null) return null;
  const payer = input.commission_payer
    ? t(`${PREFIX}.commission_payer.${input.commission_payer}`)
    : "";
  return {
    labelKey: input.commission_payer === "buyer" ? `${PREFIX}.commission_buyer` : `${PREFIX}.commission`,
    value: [value, payer].filter(Boolean).join(" \u00b7 "),
  };
}
