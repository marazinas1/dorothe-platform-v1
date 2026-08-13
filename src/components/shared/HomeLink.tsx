import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  className?: string;
  children: ReactNode;
  /** Accessible name, since the child is usually just an image. */
  label?: string;
};

/**
 * The logo link. From any other page it navigates to the homepage; on the
 * homepage itself a click scrolls back to the top instead of re-navigating,
 * which is what visitors expect from a logo and what a plain <Link> cannot do
 * (the router treats it as a no-op and the page stays where it was).
 */
export function HomeLink({ locale, className, children, label }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const atHome = pathname === `/${locale}` || pathname === `/${locale}/`;

  return (
    <Link
      to="/$locale"
      params={{ locale }}
      aria-label={label}
      className={className}
      onClick={(event) => {
        if (!atHome) return;
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
