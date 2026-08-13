import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { metricsQueryOptions } from "@/lib/dashboard/admin.functions";
import { resolvePeriod, type PeriodPreset } from "@/lib/dashboard/period";
import { durationLabel } from "@/lib/dashboard/age";
import { LISTING_STATUSES } from "@/lib/listings/admin-schema";
import { INQUIRY_TYPES } from "@/lib/inquiries/types";
import { MetricCard, MetricBreakdown } from "./MetricCard";

/**
 * The honest half of the dashboard: four figures that come from rows the broker
 * created. Nothing is inferred, nothing is estimated, and a missing figure shows
 * a dash instead of a zero that would read as a result.
 */
export function MetricsPanel({ period }: { period: PeriodPreset }) {
  const { t } = useTranslation();
  const { from, to } = resolvePeriod(period);
  const query = useQuery(metricsQueryOptions(from, to));
  const data = query.data;
  const pending = query.isPending;

  const statusRows = LISTING_STATUSES.filter(
    (status) => (data?.listingsByStatus[status] ?? 0) > 0,
  ).map((status) => ({
    label: t(`listings.status.${status}`),
    value: data?.listingsByStatus[status] ?? 0,
  }));

  const inquiryRows = INQUIRY_TYPES.filter(
    (type) => (data?.inquiriesByType[type] ?? 0) > 0,
  ).map((type) => ({
    label: t(`admin.inquiries.types.${type}`),
    value: data?.inquiriesByType[type] ?? 0,
  }));

  const inquiryTotal = Object.values(data?.inquiriesByType ?? {}).reduce(
    (sum, n) => sum + Number(n),
    0,
  );
  const closedTotal = (data?.closed.sold ?? 0) + (data?.closed.rented ?? 0);
  const duration = durationLabel(data?.processing.avgSeconds ?? null);

  if (query.isError) {
    return (
      <p className="text-sm text-muted-foreground">{t("admin.dashboard.metrics.failed")}</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label={t("admin.dashboard.metrics.listings")}
        value={pending ? null : statusRows.reduce((sum, row) => sum + row.value, 0)}
        hint={t("admin.dashboard.metrics.listingsHint")}
      >
        <MetricBreakdown rows={statusRows} />
      </MetricCard>

      <MetricCard
        label={t("admin.dashboard.metrics.inquiries")}
        value={pending ? null : inquiryTotal}
        hint={t("admin.dashboard.metrics.periodHint")}
      >
        <MetricBreakdown rows={inquiryRows} />
      </MetricCard>

      <MetricCard
        label={t("admin.dashboard.metrics.closed")}
        value={pending ? null : closedTotal}
        hint={t("admin.dashboard.metrics.periodHint")}
      >
        <MetricBreakdown
          rows={[
            { label: t("listings.status.sold"), value: data?.closed.sold ?? 0 },
            { label: t("listings.status.rented"), value: data?.closed.rented ?? 0 },
          ].filter((row) => row.value > 0)}
        />
      </MetricCard>

      <MetricCard
        label={t("admin.dashboard.metrics.processing")}
        value={pending || !duration ? null : t(duration.key, { count: duration.count })}
        hint={
          data && data.processing.sample > 0
            ? t("admin.dashboard.metrics.sample", { count: data.processing.sample })
            : t("admin.dashboard.metrics.noSample")
        }
      />
    </div>
  );
}
