import { useState } from "react";
import { useParams } from "@tanstack/react-router";

import type { Locale } from "@/i18n/config";

/**
 * Consent state for public forms that collect personal data. Unticked by
 * default; `check()` blocks submission and turns the inline message on.
 */
export function useConsent() {
  const [given, setGiven] = useState(false);
  const [error, setError] = useState(false);
  const { locale } = useParams({ strict: false }) as { locale: Locale };

  return {
    given,
    error,
    locale,
    set(value: boolean) {
      setGiven(value);
      if (value) setError(false);
    },
    check(): boolean {
      if (given) return true;
      setError(true);
      return false;
    },
  };
}
