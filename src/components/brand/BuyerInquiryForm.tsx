import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConsentCheckbox } from "@/components/public/ConsentCheckbox";
import { useConsent } from "@/lib/inquiry/use-consent";

import { submitBuyerInquiry } from "@/lib/inquiry/submit.functions";

const inputCls =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground outline-none transition-colors duration-300 focus:border-foreground";
const labelCls =
  "block text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

export function BuyerInquiryForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const consent = useConsent();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!consent.check()) return;
    setStatus("submitting");
    try {
      await submitBuyerInquiry({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          message: String(fd.get("message") ?? ""),
          property_type: String(fd.get("property_type") ?? ""),
          city: String(fd.get("city") ?? ""),
          rooms_min: numOrNull(fd.get("rooms_min")),
          area_min: numOrNull(fd.get("area_min")),
          price_max: numOrNull(fd.get("price_max")),
          consent: true,
          locale: consent.locale,
        },
      });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="border-t border-border pt-10 text-sm text-foreground">
        {t("inquiry.success")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="buyer-type">
            {t("inquiry.buyer.property_type")}
          </label>
          <select id="buyer-type" name="property_type" className={inputCls} defaultValue="">
            <option value="">{t("listings.filters.any")}</option>
            <option value="house">{t("listings.filters.house")}</option>
            <option value="apartment">{t("listings.filters.apartment")}</option>
            <option value="land">{t("listings.filters.land")}</option>
            <option value="commercial">{t("listings.filters.commercial")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="buyer-city">
            {t("inquiry.buyer.city")}
          </label>
          <input id="buyer-city" name="city" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="buyer-rooms">
            {t("inquiry.buyer.rooms_min")}
          </label>
          <input id="buyer-rooms" name="rooms_min" type="number" min="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="buyer-area">
            {t("inquiry.buyer.area_min")}
          </label>
          <input id="buyer-area" name="area_min" type="number" min="0" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="buyer-budget">
            {t("inquiry.buyer.price_max")}
          </label>
          <input id="buyer-budget" name="price_max" type="number" min="0" className={inputCls} />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="buyer-name">{t("inquiry.name")}</label>
          <input id="buyer-name" name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="buyer-email">{t("inquiry.email")}</label>
          <input id="buyer-email" name="email" type="email" required className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="buyer-phone">{t("inquiry.phone")}</label>
          <input id="buyer-phone" name="phone" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="buyer-message">{t("inquiry.message")}</label>
          <textarea id="buyer-message" name="message" rows={3} className={`${inputCls} resize-none pt-3`} />
        </div>
      </div>

      <ConsentCheckbox
        id="buyer-consent"
        checked={consent.given}
        onChange={consent.set}
        showError={consent.error}
      />

      {status === "error" ? (
        <div className="text-sm text-destructive">{t("inquiry.error")}</div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-12 items-center justify-center bg-primary px-8 text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity duration-300 hover:opacity-85 disabled:opacity-60"
      >
        {status === "submitting" ? t("inquiry.submitting") : t("inquiry.buyer.submit")}
      </button>
    </form>
  );
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
