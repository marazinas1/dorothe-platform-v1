import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export type AutosaveState = { status: AutosaveStatus; at: Date | null };

/**
 * Autosave for the listing form: debounced after typing and flushable on blur.
 * It only ever saves content — status changes stay explicit, so autosave can
 * never publish an incomplete listing, and a draft is allowed to be invalid.
 */
export function useListingAutosave({
  dirty,
  enabled,
  save,
  delay = 3000,
}: {
  dirty: boolean;
  enabled: boolean;
  /** Resolves true when the save succeeded. */
  save: () => Promise<boolean>;
  delay?: number;
}) {
  const [state, setState] = useState<AutosaveState>({ status: "idle", at: null });
  const running = useRef(false);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(async () => {
    if (!enabled || !dirty || running.current) return;
    running.current = true;
    setState((prev) => ({ ...prev, status: "saving" }));
    try {
      const ok = await saveRef.current();
      setState({ status: ok ? "saved" : "error", at: ok ? new Date() : null });
    } catch {
      setState({ status: "error", at: null });
    } finally {
      running.current = false;
    }
  }, [dirty, enabled]);

  useEffect(() => {
    if (!enabled || !dirty) return;
    const timer = setTimeout(() => void flush(), delay);
    return () => clearTimeout(timer);
  }, [enabled, dirty, delay, flush]);

  return { state, flush };
}
