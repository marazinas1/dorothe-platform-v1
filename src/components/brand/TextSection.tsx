import type { ReactNode } from "react";

import { SECTION_GAP, type SectionGap } from "@/lib/homepage/rhythm";

type Props = {
  title: string;
  body?: string;
  /** Optional plain list rendered under the body, e.g. what she brings. */
  items?: string[];
  /** Anything trailing: a link, a form, a quiet contact line. */
  children?: ReactNode;
  gap?: SectionGap;
  /** Quiet variant: smaller heading, used where a hard sell is wrong. */
  quiet?: boolean;
};

/**
 * A text-led argument block: heading on the left, prose (and optionally a
 * plain list) on the right. Heading weight comes from the shared tiers, and
 * distance from SECTION_GAP — nothing here sets its own scale.
 */
export function TextSection({
  title,
  body,
  items,
  children,
  gap = "normal",
  quiet = false,
}: Props) {
  return (
    <section className={`mx-auto ${SECTION_GAP[gap]} max-w-[1400px] px-6 lg:px-10`}>
      <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 className={`${quiet ? "text-section-sm" : "text-section"} max-w-[18ch] text-balance`}>
            {title}
          </h2>
        </div>
        <div className="md:col-span-8">
          {body ? (
            <p className="text-lead max-w-[62ch] text-muted-foreground">{body}</p>
          ) : null}

          {items && items.length > 0 ? (
            <ul className="mt-10 border-t border-border">
              {items.map((item, i) => (
                <li key={i} className="border-b border-border py-5 text-base leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          ) : null}

          {children ? <div className="mt-10">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
