import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

const ENDPOINT = "/api/public/track-view";

/**
 * Fire-and-forget first-party pageview ping. No cookies, no storage, admin
 * routes are never tracked and every failure is swallowed.
 */
export function usePageTracking() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (/\/admin(\/|$)/.test(pathname)) return;
    if (lastSent.current === pathname) return;
    lastSent.current = pathname;

    const payload = JSON.stringify({ path: pathname, referrer: document.referrer });

    // text/plain avoids a CORS preflight so sendBeacon can actually transmit.
    try {
      const blob = new Blob([payload], { type: "text/plain" });
      if (navigator.sendBeacon?.(ENDPOINT, blob)) return;
    } catch {
      /* fall through to fetch */
    }

    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* analytics must never break the page */
    });
  }, [pathname]);
}
