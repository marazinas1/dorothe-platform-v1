import { useTranslation } from "react-i18next";

import { PERIOD_PRESETS, type PeriodPreset } from "@/lib/dashboard/period";
import { cn } from "@/lib/utils";

/** Period selector for the metrics half. Presets only — no invented ranges. */
export function PeriodPicker({
  value,
  onChange,
}: {
  value: PeriodPreset;
  onChange: (next: PeriodPreset) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      className="inline-flex rounded-full border border-border bg-muted/40 p-0.5"
      role="group"
      aria-label={t("admin.dashboard.metrics.period")}
    >
      {PERIOD_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          aria-pressed={preset === value}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            preset === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(`admin.dashboard.period.${preset}`)}
        </button>
      ))}
    </div>
  );
}
