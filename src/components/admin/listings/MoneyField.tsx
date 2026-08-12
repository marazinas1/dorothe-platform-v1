import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { FALLBACK_LOCALE } from "@/i18n/config";
import { formatMoneyInput, parseMoneyInput } from "@/lib/listings/money";
import { FieldRow } from "./FieldRow";

/**
 * One money input. Grouping and parsing follow the SITE's locale
 * (site_settings.default_locale), never the operator's interface language:
 * money conventions belong to the market the listing is sold in. Otherwise a
 * figure copied from a German portal ("549.000") would parse as 549 while the
 * panel is in English.
 */
export function MoneyField({
  label,
  help,
  symbol,
  value,
  onChange,
  anchor,
  className,
  disabled = false,
  readOnly = false,
}: {
  label: string;
  help?: string;
  symbol: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  /** Anchor id so the publish checklist can scroll to this field. */
  anchor?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const moneyLocale = settings.default_locale ?? FALLBACK_LOCALE;
  const [raw, setRaw] = useState("");

  return (
    <FieldRow label={label} help={help} className={className} anchor={anchor}>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background pl-3 focus-within:ring-1 focus-within:ring-ring">
        <span className="text-sm text-muted-foreground">{symbol}</span>
        <Input
          inputMode="decimal"
          disabled={disabled}
          readOnly={readOnly}
          className="border-0 bg-transparent shadow-none tabular-nums focus-visible:ring-0"
          value={formatMoneyInput(value, raw, moneyLocale)}
          onChange={(e) => {
            setRaw(e.target.value);
            onChange(parseMoneyInput(e.target.value, moneyLocale));
          }}
          onBlur={() => setRaw("")}
        />
      </div>
    </FieldRow>
  );
}
