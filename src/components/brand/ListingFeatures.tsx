import { useTranslation } from "react-i18next";

/**
 * Equipment features as a compact grid. Presentational only: labels come from
 * the shared vocabulary keys, so one entry reads correctly in every language.
 */
export function ListingFeatures({ features }: { features: string[] | null | undefined }) {
  const { t } = useTranslation();
  const list = (features ?? []).filter((key) => typeof key === "string" && key.length > 0);
  if (list.length === 0) return null;

  return (
    <div className="border-t border-border pt-6">
      <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {t("listings.detail.features")}
      </h2>
      <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((key) => (
          <li key={key} className="flex items-baseline gap-3 text-sm text-foreground">
            <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-primary" />
            {t(`listings.features.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
