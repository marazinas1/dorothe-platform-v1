import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Eye, Inbox, TrendingUp, Users } from "lucide-react";

import { analyticsSummaryQueryOptions } from "@/lib/analytics/admin.functions";
import {
  ANALYTICS_RANGES,
  buildSeries,
  percentChange,
  type AnalyticsRange,
} from "@/lib/analytics/summary";
import { cn } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { BreakdownList } from "./BreakdownList";
import { TrafficChart } from "./TrafficChart";

function RangePicker({
  value,
  onChange,
}: {
  value: AnalyticsRange;
  onChange: (next: AnalyticsRange) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="inline-flex rounded-full border border-border bg-muted/40 p-0.5" role="group">
      {ANALYTICS_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onChange(range)}
          aria-pressed={range === value}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-colors",
            range === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t("admin.analytics.range", { count: range })}
        </button>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { locale } = useParams({ from: "/$locale/admin/analytics" });
  const [range, setRange] = useState<AnalyticsRange>(30);
  const { data, isPending, error } = useQuery(analyticsSummaryQueryOptions(range));

  const views = Number(data?.totals?.views ?? 0);
  const visitors = Number(data?.totals?.visitors ?? 0);
  const inquiries = Number(data?.inquiries ?? 0);
  const conversion = visitors ? ((inquiries / visitors) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">{t("admin.analytics.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.analytics.subtitle")}</p>
        </div>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {t("admin.analytics.error")} {error instanceof Error ? error.message : ""}
        </div>
      ) : null}

      {isPending ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("admin.analytics.loading")}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("admin.analytics.views")}
              value={views}
              change={percentChange(views, Number(data?.previous?.views ?? 0))}
              icon={Eye}
            />
            <StatCard
              label={t("admin.analytics.visitors")}
              value={visitors}
              change={percentChange(visitors, Number(data?.previous?.visitors ?? 0))}
              icon={Users}
            />
            <StatCard label={t("admin.analytics.inquiries")} value={inquiries} icon={Inbox} />
            <StatCard
              label={t("admin.analytics.conversion")}
              value={conversion}
              suffix="%"
              icon={TrendingUp}
            />
          </div>

          <TrafficChart data={buildSeries(data?.daily ?? [], range)} locale={locale} />

          <div className="grid gap-3 lg:grid-cols-3">
            <BreakdownList
              title={t("admin.analytics.topPages")}
              total={views}
              empty={t("admin.analytics.emptyPages")}
              rows={(data?.top_pages ?? []).map((p) => ({
                label: p.path,
                views: Number(p.views),
              }))}
            />
            <BreakdownList
              title={t("admin.analytics.sources")}
              total={views}
              empty={t("admin.analytics.emptySources")}
              rows={(data?.sources ?? []).map((s) => ({
                label: t(`admin.analytics.source.${s.source}`, { defaultValue: s.source }),
                views: Number(s.views),
              }))}
            />
            <BreakdownList
              title={t("admin.analytics.devices")}
              total={views}
              empty={t("admin.analytics.emptyDevices")}
              rows={(data?.devices ?? []).map((d) => ({
                label: t(`admin.analytics.device.${d.device}`, { defaultValue: d.device }),
                views: Number(d.views),
              }))}
            />
          </div>

          {views === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.analytics.emptyHint")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
