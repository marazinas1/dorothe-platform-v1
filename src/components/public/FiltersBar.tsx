import { useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { siteSettingsQueryOptions } from "@/lib/config/site-settings.functions";
import { exampleCity } from "@/lib/config/site-copy";

import type { ListingsSearch } from "@/lib/listings/search-schema";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  search: ListingsSearch;
  total: number;
};

/** URL-driven filter bar. Every change navigates so state is shareable. */
export function FiltersBar({ locale, search, total }: Props) {
  const { t } = useTranslation();
  const { data: settings } = useSuspenseQuery(siteSettingsQueryOptions);
  const navigate = useNavigate({ from: "/$locale/immobilien/" });

  const update = (patch: Partial<ListingsSearch>) => {
    navigate({
      params: { locale },
      search: (prev: ListingsSearch) => ({ ...prev, ...patch, page: 1 }),
    });
  };
  const reset = () =>
    navigate({
      params: { locale },
      search: {
        deal: "",
        type: "",
        city: "",
        rooms_min: 0,
        price_min: 0,
        price_max: 0,
        area_min: 0,
        sort: "newest",
        page: 1,
        view: "grid",
      },
    });

  const inputCls =
    "w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-foreground outline-none focus:border-foreground";
  const labelCls =
    "block text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

  return (
    <div className="border-y border-border py-8">
      <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4 lg:grid-cols-7">
        <div>
          <label className={labelCls}>{t("listings.filters.deal")}</label>
          <select
            className={inputCls}
            value={search.deal}
            onChange={(e) => update({ deal: e.target.value })}
          >
            <option value="">{t("listings.filters.any")}</option>
            <option value="sale">{t("listings.filters.sale")}</option>
            <option value="rent">{t("listings.filters.rent")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("listings.filters.type")}</label>
          <select
            className={inputCls}
            value={search.type}
            onChange={(e) => update({ type: e.target.value })}
          >
            <option value="">{t("listings.filters.any")}</option>
            <option value="house">{t("listings.filters.house")}</option>
            <option value="apartment">{t("listings.filters.apartment")}</option>
            <option value="land">{t("listings.filters.land")}</option>
            <option value="commercial">{t("listings.filters.commercial")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("listings.filters.city")}</label>
          <input
            className={inputCls}
            placeholder={t("listings.filters.city_placeholder", { city: exampleCity(settings, locale) })}
            defaultValue={search.city}
            onBlur={(e) => update({ city: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") update({ city: (e.target as HTMLInputElement).value });
            }}
          />
        </div>
        <div>
          <label className={labelCls}>{t("listings.filters.rooms_min")}</label>
          <input
            type="number"
            min={0}
            className={`${inputCls} tabular-figures`}
            defaultValue={search.rooms_min || ""}
            onBlur={(e) => update({ rooms_min: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className={labelCls}>{t("listings.filters.price_min")}</label>
          <input
            type="number"
            min={0}
            step={1000}
            className={`${inputCls} tabular-figures`}
            defaultValue={search.price_min || ""}
            onBlur={(e) => update({ price_min: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className={labelCls}>{t("listings.filters.price_max")}</label>
          <input
            type="number"
            min={0}
            step={1000}
            className={`${inputCls} tabular-figures`}
            defaultValue={search.price_max || ""}
            onBlur={(e) => update({ price_max: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className={labelCls}>{t("listings.filters.area_min")}</label>
          <input
            type="number"
            min={0}
            className={`${inputCls} tabular-figures`}
            defaultValue={search.area_min || ""}
            onBlur={(e) => update({ area_min: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {t("listings.results_count").replace("{{count}}", String(total))}
        </div>
        <div className="flex items-center gap-6">
          <select
            className="border-0 border-b border-border bg-transparent py-1 text-sm text-foreground outline-none focus:border-foreground"
            value={search.sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            <option value="newest">{t("listings.sort.newest")}</option>
            <option value="price_asc">{t("listings.sort.price_asc")}</option>
            <option value="price_desc">{t("listings.sort.price_desc")}</option>
          </select>
          <button
            type="button"
            onClick={reset}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("listings.filters.reset")}
          </button>
        </div>
      </div>
    </div>
  );
}
