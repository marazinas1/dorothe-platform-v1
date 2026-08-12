import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { formatMoneyInput, parseMoneyInput } from "@/lib/listings/money";
import { FieldRow } from "./FieldRow";

/**
 * One money input. Digits are grouped as the broker types (549.000 in German,
 * 549,000 in English) while the stored value stays a plain number, so nothing in
 * the database ever depends on the interface language.
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
  const { i18n } = useTranslation();
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
          value={formatMoneyInput(value, raw, i18n.language)}
          onChange={(e) => {
            setRaw(e.target.value);
            onChange(parseMoneyInput(e.target.value, i18n.language));
          }}
          onBlur={() => setRaw("")}
        />
      </div>
    </FieldRow>
  );
}
