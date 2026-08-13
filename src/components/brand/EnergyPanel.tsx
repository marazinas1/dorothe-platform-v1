import { useTranslation } from "react-i18next";

import { energyView, type EnergyCell } from "@/lib/listings/energy-display";

type Props = {
  energy: unknown;
  propertyType: string;
  exemption?: string | null;
  /** site_settings.country — the market decides which figures are disclosed. */
  country: string;
};

/**
 * Energy certificate panel. The fields are chosen per country in
 * src/lib/listings/energy-display.ts (GEG in Germany, EAVG in Austria, GEAK in
 * Switzerland); this component only renders what it is given.
 */
export function EnergyPanel({ energy, propertyType, exemption, country }: Props) {
  const { t, i18n } = useTranslation();
  const view = energyView({
    country,
    energy,
    propertyType,
    exemption,
    locale: i18n.language,
  });

  if (view.kind === "exempt") {
    if (!view.exemptionKey) return null;
    return (
      <Frame t={t}>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t(view.exemptionKey)}
        </p>
      </Frame>
    );
  }

  if (view.kind === "missing") {
    return (
      <Frame t={t}>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("listings.detail.energy_missing")}
        </p>
      </Frame>
    );
  }

  return (
    <Frame t={t}>
      <div className="mt-8 grid gap-10 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
        {view.efficiencyClass ? (
          <div className="flex flex-col items-start">
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("listings.detail.energy_class")}
            </div>
            <div className="mt-3 flex h-20 w-20 items-center justify-center rounded-media border border-border bg-secondary font-heading text-4xl text-secondary-foreground">
              {view.efficiencyClass}
            </div>
          </div>
        ) : null}

        <dl className="grid gap-x-12 sm:grid-cols-2">
          {view.cells.map((cell) => (
            <div
              key={cell.labelKey}
              className="flex items-baseline justify-between gap-6 border-b border-border py-4"
            >
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t(cell.labelKey)}
              </dt>
              <dd className="tabular-figures text-right text-base text-foreground">
                {cellValue(cell, t)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-8 max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {t(view.footnoteKey)}
      </p>
    </Frame>
  );
}

function cellValue(cell: EnergyCell, t: (key: string) => string): string {
  if (cell.valueKeys) return cell.valueKeys.map((k) => t(k)).join(", ");
  if (cell.valueKey) return t(cell.valueKey);
  return cell.value ?? "";
}

function Frame({
  t,
  children,
}: {
  t: (key: string) => string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
        {t("listings.detail.energy")}
      </h2>
      {children}
    </div>
  );
}
