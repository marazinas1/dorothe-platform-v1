import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SiteSettings } from "@/types/site-settings";
import {
  GeneralSchema,
  BrandingSchema,
  ContactSchema,
  LegalSchema,
  AnalyticsSchema,
  type SettingsTabKey,
} from "@/lib/validation/site-settings";

export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const { createPublicSupabase } = await import("@/lib/supabase/server-public");
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Failed to load site_settings: ${error.message}`);
    if (!data) throw new Error("site_settings row missing; run the initial migration.");
    return data as unknown as SiteSettings;
  },
);

export const siteSettingsQueryOptions = queryOptions({
  queryKey: ["site_settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 60_000,
});

type UpdateInput =
  | { tab: "general"; values: unknown }
  | { tab: "branding"; values: unknown }
  | { tab: "contact"; values: unknown }
  | { tab: "legal"; values: unknown }
  | { tab: "analytics"; values: unknown };

function parseByTab(input: UpdateInput): Record<string, unknown> {
  switch (input.tab) {
    case "general":
      return GeneralSchema.parse(input.values);
    case "branding":
      return BrandingSchema.parse(input.values);
    case "contact":
      return ContactSchema.parse(input.values);
    case "legal":
      return LegalSchema.parse(input.values);
    case "analytics":
      return AnalyticsSchema.parse(input.values);
  }
}

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: UpdateInput) => {
    const allowed: SettingsTabKey[] = [
      "general",
      "branding",
      "contact",
      "legal",
      "analytics",
    ];
    if (!allowed.includes(input.tab as SettingsTabKey)) {
      throw new Error("Invalid tab");
    }
    return input;
  })
  .handler(async ({ data, context }): Promise<SiteSettings> => {
    const { supabase, userId } = context;
    const { assertPermission } = await import("@/lib/auth/require-permission.server");
    await assertPermission(supabase, userId, "settings.edit");

    const patch = parseByTab(data);
    const { data: current, error: readError } = await supabase
      .from("site_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (readError || !current) {
      throw new Error("site_settings row missing");
    }
    const { data: updated, error } = await supabase
      .from("site_settings")
      .update(patch as never)
      .eq("id", current.id)
      .select("*")
      .maybeSingle();
    if (error || !updated) {
      throw new Error(`Update failed: ${error?.message ?? "unknown"}`);
    }
    return updated as unknown as SiteSettings;
  });
