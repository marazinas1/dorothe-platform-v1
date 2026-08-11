import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/config";

/** Clears cached admin data, ends the session and returns to the login page. */
export function useSignOut() {
  const { locale } = useParams({ strict: false }) as { locale: Locale };
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  return async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/$locale/auth/login", params: { locale }, replace: true });
  };
}
