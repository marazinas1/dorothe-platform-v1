import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point {
  day: string;
  views: number;
  visitors: number;
}

/** Views and unique visitors per day. Colours come from the theme tokens. */
export function TrafficChart({ data, locale }: { data: Point[]; locale: string }) {
  const { t } = useTranslation();
  const rows = data.map((p) => ({
    ...p,
    label: new Date(`${p.day}T00:00:00Z`).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium">{t("admin.analytics.traffic")}</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="analyticsViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="analyticsVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                background: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              name={t("admin.analytics.views")}
              stroke="hsl(var(--primary))"
              fill="url(#analyticsViews)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              name={t("admin.analytics.visitors")}
              stroke="hsl(var(--accent))"
              fill="url(#analyticsVisitors)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
