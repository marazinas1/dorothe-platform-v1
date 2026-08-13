import { useTranslation } from "react-i18next";

import { SECTION_GAP } from "@/lib/homepage/rhythm";
import type { PublicTeamMember } from "@/lib/team/queries.functions";

type Props = {
  members: PublicTeamMember[];
};

/**
 * Team grid. Rendered only when there are members flagged show_on_website.
 * The parent route is responsible for gating this behind the `team` feature flag.
 */
export function TeamSection({ members }: Props) {
  const { t } = useTranslation();
  if (!members || members.length === 0) return null;

  return (
    <section className={`mx-auto ${SECTION_GAP.normal} max-w-[1400px] px-6 lg:px-10`}>
      <div className="mb-14 max-w-2xl">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("home.team_kicker")}
        </div>
        <h2 className="text-section mt-4">
          {t("home.team_title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 border-t border-border pt-14 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <article key={m.id}>
            <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
              {m.public_photo_url ? (
                <img
                  src={m.public_photo_url}
                  alt={m.full_name ?? ""}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="mt-6">
              <div className="font-heading text-2xl">{m.full_name}</div>
              {m.public_title ? (
                <div className="mt-1 text-sm text-muted-foreground">{m.public_title}</div>
              ) : null}
              {m.specializations && m.specializations.length > 0 ? (
                <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {m.specializations.join(" · ")}
                </div>
              ) : null}
              {m.languages_spoken && m.languages_spoken.length > 0 ? (
                <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {m.languages_spoken.join(" · ")}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
