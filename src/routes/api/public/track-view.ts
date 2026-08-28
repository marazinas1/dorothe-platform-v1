// Cookieless first-party pageview collector. Public by design (the site pings
// it anonymously) and always silent: analytics must never affect the site.
import { createFileRoute } from "@tanstack/react-router";

import {
  deviceFrom,
  insertPageView,
  isBot,
  sourceFrom,
  visitorHash,
} from "@/lib/analytics/track.server";

const noContent = () => new Response(null, { status: 204 });

export const Route = createFileRoute("/api/public/track-view")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userAgent = request.headers.get("user-agent") ?? "";
          if (isBot(userAgent)) return noContent();

          const raw = await request.text();
          if (!raw) return noContent();
          let body: { path?: unknown; referrer?: unknown };
          try {
            body = JSON.parse(raw);
          } catch {
            return noContent();
          }

          const path = typeof body.path === "string" ? body.path.slice(0, 300) : "";
          if (!path.startsWith("/") || /\/admin(\/|$)/.test(path)) return noContent();

          const selfHost = new URL(request.url).hostname.toLowerCase();
          let referrerHost: string | null = null;
          if (typeof body.referrer === "string" && body.referrer) {
            try {
              referrerHost = new URL(body.referrer).hostname.toLowerCase().slice(0, 200);
            } catch {
              referrerHost = null;
            }
          }
          // Internal navigation is not an acquisition source.
          if (referrerHost === selfHost) referrerHost = null;

          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            "unknown";
          const day = new Date().toISOString().slice(0, 10);

          await insertPageView({
            path,
            referrer_host: referrerHost,
            source: sourceFrom(referrerHost),
            device: deviceFrom(userAgent),
            country: request.headers.get("cf-ipcountry"),
            visitor_hash: await visitorHash(
              process.env["ANALYTICS_SALT"] ?? "",
              day,
              ip,
              userAgent,
            ),
            day,
          });
        } catch (err) {
          console.error("track-view error:", err instanceof Error ? err.message : String(err));
        }
        return noContent();
      },
    },
  },
});
