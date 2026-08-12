// The only write path for the per-user admin interface language.
//
// profiles also holds `role` and `is_active`, so this deliberately does NOT
// rely on a broad self-update policy: it updates exactly one column for the
// authenticated caller, and validates the value against the shipped message
// files before touching the row.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MESSAGE_LOCALES } from "@/i18n/config";

const Input = z.object({
  locale: z.enum(MESSAGE_LOCALES as unknown as [string, ...string[]]).nullable(),
});

export const setAdminLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ admin_locale: data.locale } as never)
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { locale: data.locale };
  });
