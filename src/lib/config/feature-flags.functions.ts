import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FeatureFlags } from "@/types/feature-flags";

export const getFeatureFlags = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeatureFlags> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key, enabled, config");
    if (error) throw new Error(`Failed to load feature_flags: ${error.message}`);
    const flags: FeatureFlags = {};
    for (const row of (data ?? []) as Array<{
      key: string;
      enabled: boolean;
      config: Record<string, any>;
    }>) {
      flags[row.key] = { enabled: row.enabled, config: row.config ?? {} };
    }
    return flags;
  },
);

export const featureFlagsQueryOptions = queryOptions({
  queryKey: ["feature_flags"],
  queryFn: () => getFeatureFlags(),
  staleTime: 60_000,
});

const UpdateFlagSchema = z.object({
  key: z.string().trim().min(1).max(64),
  enabled: z.boolean(),
});

export const updateFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateFlagSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { assertPermission } = await import("@/lib/auth/require-permission.server");
    // design.edit is owner-only per the permission matrix.
    await assertPermission(supabase, userId, "design.edit");

    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: data.enabled })
      .eq("key", data.key);
    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
    return { ok: true as const };
  });
