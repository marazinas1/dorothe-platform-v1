import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";
import { submitBuyerInquiry, submitSellerInquiry } from "@/lib/inquiry/submit.functions";

const inputCls =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground outline-none transition-colors duration-300 focus:border-foreground";
const labelCls = "block text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

type Props = {
  mode: "seller" | "buyer";
  locale: Locale;
};

/**
 * First-contact form for the homepage: name, email, phone, town and one free
 * message. Deliberately short — the qualifying intake form lives on the
 * valuation page, where the visitor has already decided.
 */
export function ShortInquiryForm({ mode, locale }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setStatus("submitting");
    const base = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    const town = String(fd.get("town") ?? "");
    try {
      if (mode === "seller") {
        await submitSellerInquiry({ data: { ...base, address_city: town } });
      } else {
        await submitBuyerInquiry({ data: { ...base, city: town } });
      }
      setStatus("success");
      form.reset();
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

  const id = (f: string) => `${mode}-short-${f}`;

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor={id("name")}>
            {t("inquiry.name")}
          </label>
          <input id={id("name")} name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={id("email")}>
            {t("inquiry.email")}
          </label>
          <input id={id("email")} name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={id("phone")}>
            {t("inquiry.phone")}
          </label>
          <input id={id("phone")} name="phone" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={id("town")}>
            {t(mode === "seller" ? "inquiry.seller.address_city" : "inquiry.buyer.city")}
          </label>
          <input id={id("town")} name="town" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor={id("message")}>
            {t("inquiry.message")}
          </label>
          <textarea
            id={id("message")}
            name="message"
            rows={4}
            className={`${inputCls} resize-none pt-3`}
          />
        </div>
      </div>

      {status === "error" ? (
        <div className="text-sm text-destructive">{t("inquiry.error")}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="eyebrow inline-flex h-12 items-center justify-center rounded-sm bg-primary px-8 text-primary-foreground transition-opacity duration-300 hover:opacity-90 disabled:opacity-60"
        >
          {status === "submitting" ? t("inquiry.submitting") : t("inquiry.submit")}
        </button>
        {mode === "seller" ? (
          <Link
            to="/$locale/immobilienbewertung"
            params={{ locale }}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-300 hover:text-foreground hover:underline"
          >
            {t("inquiry.seller.full_form_link")} →
          </Link>
        ) : (
          <Link
            to="/$locale/immobilien"
            params={{ locale }}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-300 hover:text-foreground hover:underline"
          >
            {t("inquiry.buyer.catalogue_link")} →
          </Link>
        )}
      </div>
    </form>
  );
}
