import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy route. A valuation is a step inside selling, not a destination of its
 * own, so the page moved to /verkaufen and this path redirects permanently —
 * old links, portal profiles and printed material keep working.
 */
export const Route = createFileRoute("/$locale/immobilienbewertung")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$locale/verkaufen",
      params: { locale: params.locale },
      statusCode: 301,
    });
  },
});
