import { useTranslation } from "react-i18next";

interface Props {
  primary: string;
  secondary: string;
  accent: string;
  fontHeading: string;
  fontBody: string;
}

export function BrandingPreview({ primary, secondary, accent, fontHeading, fontBody }: Props) {
  const { t } = useTranslation();
  const style: React.CSSProperties = {
    // Scoped CSS variables inside the preview box.
    ["--preview-primary" as unknown as string]: primary || "var(--primary)",
    ["--preview-secondary" as unknown as string]: secondary || "var(--secondary)",
    ["--preview-accent" as unknown as string]: accent || "var(--accent)",
    fontFamily: fontBody || undefined,
  };
  return (
    <div
      className="mt-4 rounded-md border border-border p-4"
      style={style}
    >
      <div className="text-xs uppercase text-muted-foreground">
        {t("admin.settings.branding.preview")}
      </div>
      <h3
        className="mt-2 text-2xl font-semibold"
        style={{
          fontFamily: fontHeading || undefined,
          color: "var(--preview-primary)",
        }}
      >
        {t("admin.settings.branding.preview_heading")}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("admin.settings.branding.preview_body")}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium"
          style={{
            background: "var(--preview-primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {t("admin.settings.branding.preview_button")}
        </button>
        <span
          className="inline-block h-8 w-8 rounded"
          style={{ background: "var(--preview-secondary)" }}
        />
        <span
          className="inline-block h-8 w-8 rounded"
          style={{ background: "var(--preview-accent)" }}
        />
      </div>
    </div>
  );
}
