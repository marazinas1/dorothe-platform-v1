// Admin analytics read. The aggregate lives in SQL and enforces the analytics
// permission itself, so this function is a thin, typed pass-through.
import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ANALYTICS_RANGES, EMPTY_SUMMARY, isoDay } from "./summary";
import type { AnalyticsRange, AnalyticsSummary } from "./summary";

const RangeInput = z.object({
  range: z.union([z.literal(7), z.literal(30), z.literal(90)]),
});

export const analyticsSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { range: AnalyticsRange }) => RangeInput.parse(input))
  .handler(async ({ data, context }): Promise<AnalyticsSummary> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpc = context.supabase.rpc as unknown as (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;

    const { data: result, error } = await rpc("analytics_summary", {
      _from: isoDay(data.range - 1),
      _to: isoDay(0),
    });
    if (error) throw new Error(error.message);
    return { ...EMPTY_SUMMARY, ...((result as AnalyticsSummary | null) ?? {}) };
  });

export function analyticsSummaryQueryOptions(range: AnalyticsRange) {
  return queryOptions({
    queryKey: ["admin", "analytics", range],
    queryFn: () => analyticsSummary({ data: { range } }),
    staleTime: 60_000,
  });
}

export { ANALYTICS_RANGES };
