import { TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

/** One headline figure with an optional previous-period delta. */
export function StatCard({
  label,
  value,
  change,
  suffix,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  change?: number | null;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const { t } = useTranslation();
  const positive = (change ?? 0) >= 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 font-heading text-2xl tabular-nums">
        {value}
        {suffix ? <span className="text-base text-muted-foreground">{suffix}</span> : null}
      </p>
      {change !== undefined && change !== null ? (
        <p
          className={`mt-1 flex items-center gap-1 text-xs ${
            positive ? "text-primary" : "text-destructive"
          }`}
        >
          {positive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {positive ? "+" : ""}
          {change}% {t("admin.analytics.vsPrevious")}
        </p>
      ) : null}
    </div>
  );
}
