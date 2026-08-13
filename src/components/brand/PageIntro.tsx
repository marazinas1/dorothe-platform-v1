type Props = {
  kicker: string;
  headline: string;
  lead: string;
};

/**
 * Opening block of a content page: eyebrow, one large statement, one lead
 * paragraph. Uses the shared type tiers so no page invents its own hero size.
 */
export function PageIntro({ kicker, headline, lead }: Props) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 pt-32 lg:px-10 lg:pt-40">
      <div className="eyebrow text-muted-foreground">{kicker}</div>
      <h1 className="text-section-lg mt-8 max-w-[22ch] text-balance">{headline}</h1>
      <p className="text-lead mt-10 max-w-[58ch] text-muted-foreground">{lead}</p>
    </section>
  );
}
