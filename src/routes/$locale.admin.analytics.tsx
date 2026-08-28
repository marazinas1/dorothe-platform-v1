import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsPage } from "@/components/admin/analytics/AnalyticsPage";

export const Route = createFileRoute("/$locale/admin/analytics")({
  component: AnalyticsPage,
});
