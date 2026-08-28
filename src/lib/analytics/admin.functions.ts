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
    // The RPC is newer than the generated types, so the call is loosely typed
    // here and re-narrowed by AnalyticsSummary on the way out.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = context.supabase as any;
    let result: unknown = null;
    let error: { message: string } | null = null;
    try {
      const res = await client.rpc("analytics_summary", {
        _from: isoDay(data.range - 1),
        _to: isoDay(0),
      });
      result = res.data;
      error = res.error;
    } catch (e) {
      console.error("ANALYTICS_DEBUG", e instanceof Error ? e.stack : String(e));
      throw e;
    }
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
