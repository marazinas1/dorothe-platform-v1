import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { WorkQueue } from "@/components/admin/dashboard/WorkQueue";
import { MetricsPanel } from "@/components/admin/dashboard/MetricsPanel";
import { PeriodPicker } from "@/components/admin/dashboard/PeriodPicker";
import { FirstRun } from "@/components/admin/dashboard/FirstRun";
import { metricsQueryOptions } from "@/lib/dashboard/admin.functions";
import { DEFAULT_PERIOD, resolvePeriod, type PeriodPreset } from "@/lib/dashboard/period";

export const Route = createFileRoute("/$locale/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const { locale } = Route.useParams();
  const [period, setPeriod] = useState<PeriodPreset>(DEFAULT_PERIOD);
  const { from, to } = resolvePeriod(period);

  // Distinguishes "nothing to do" from "nothing exists yet".
  const overview = useQuery(metricsQueryOptions(from, to));
  const empty = overview.data?.totalListings === 0;

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl">{t("admin.pages.dashboard")}</h1>

      {empty ? <FirstRun locale={locale} /> : <WorkQueue locale={locale} />}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-lg">{t("admin.dashboard.metrics.heading")}</h2>
          <div className="ml-auto">
            <PeriodPicker value={period} onChange={setPeriod} />
          </div>
        </div>
        <MetricsPanel period={period} />
      </section>
    </div>
  );
}
