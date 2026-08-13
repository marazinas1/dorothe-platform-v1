import { useTranslation } from "react-i18next";

import { legalParagraphs } from "@/lib/legal/documents";

type Props = {
  title: string;
  text: string;
};

/**
 * Renders a stored legal document. The text is trusted admin input but is
 * printed as text nodes only, so no markup or script from the settings row can
 * execute. An empty document says so instead of rendering a blank page.
 */
export function LegalDocument({ title, text }: Props) {
  const { t } = useTranslation();
  const paragraphs = legalParagraphs(text);

  return (
    <div className="mx-auto max-w-[820px] px-6 pb-32 lg:px-10">
      <h1 className="font-heading text-4xl md:text-5xl">{title}</h1>

      {paragraphs.length === 0 ? (
        <div className="mt-10 border border-border bg-secondary/40 p-6">
          <p className="text-sm font-medium text-foreground">{t("legal.missing.title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("legal.missing.body")}</p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground"
            >
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
