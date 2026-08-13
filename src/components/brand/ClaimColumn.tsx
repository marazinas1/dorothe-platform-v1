import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  body: string;
  /** Quiet line naming the credential behind the claim. */
  evidence: string;
};

/**
 * One claim: a short sage rule, a thin line mark, a heading, one sentence and
 * the evidence. No card, no border box — the rule and the space do the work.
 */
export function ClaimColumn({ icon: Icon, title, body, evidence }: Props) {
  return (
    <div>
      <div className="h-px w-10 bg-primary" />
      <Icon
        className="mt-7 text-muted-foreground"
        size={28}
        strokeWidth={1.25}
        aria-hidden="true"
      />
      <h3 className="mt-6 font-heading text-xl leading-snug text-foreground md:text-2xl">
        {title}
      </h3>
      <p className="mt-4 max-w-[38ch] text-base leading-relaxed text-muted-foreground">{body}</p>
      <p className="mt-5 text-xs uppercase tracking-[0.14em] text-muted-foreground">{evidence}</p>
    </div>
  );
}
