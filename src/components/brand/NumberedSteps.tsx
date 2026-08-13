import { SECTION_GAP } from "@/lib/homepage/rhythm";

export type Step = { title: string; body: string };

type Props = {
  title: string;
  steps: Step[];
};

/**
 * Process as a numbered list: the left column names the phase, the right one
 * explains it. Dense on purpose — the steps read as one object, not six blocks.
 */
export function NumberedSteps({ title, steps }: Props) {
  if (!steps || steps.length === 0) return null;

  return (
    <section className={`mx-auto ${SECTION_GAP.normal} max-w-[1400px] px-6 lg:px-10`}>
      <div className="grid grid-cols-1 gap-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <h2 className="text-section max-w-[18ch] text-balance">{title}</h2>
        </div>
        <div className="md:col-span-8">
          <ol className="divide-y divide-border border-y border-border">
            {steps.map((s, i) => (
              <li key={i} className="grid grid-cols-12 gap-6 py-9">
                <div className="col-span-2 font-sans text-2xl tabular-figures text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="col-span-10">
                  <div className="text-section-sm">{s.title}</div>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
