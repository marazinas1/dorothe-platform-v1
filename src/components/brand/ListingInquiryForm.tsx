import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConsentCheckbox } from "@/components/public/ConsentCheckbox";
import { useConsent } from "@/lib/inquiry/use-consent";

import { submitInquiry } from "@/lib/inquiry/submit.functions";

type Props = {
  listingId: string;
  defaultMessage?: string;
};

const inputCls =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground outline-none transition-colors duration-300 focus:border-foreground";
const labelCls =
  "block text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

/** Listing-specific inquiry form used on the detail page. */
export function ListingInquiryForm({ listingId, defaultMessage }: Props) {
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
      await submitInquiry({
        data: {
          listing_id: listingId,
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          message: String(fd.get("message") ?? ""),
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
    <form onSubmit={onSubmit}>
      <h2 className="font-heading text-2xl md:text-3xl">{t("inquiry.title")}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{t("inquiry.subtitle")}</p>

      <div className="mt-8 grid gap-8">
        <div>
          <label className={labelCls} htmlFor="inq-name">{t("inquiry.name")}</label>
          <input id="inq-name" name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="inq-email">{t("inquiry.email")}</label>
          <input id="inq-email" name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="inq-phone">{t("inquiry.phone")}</label>
          <input id="inq-phone" name="phone" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="inq-message">{t("inquiry.message")}</label>
          <textarea
            id="inq-message"
            name="message"
            required
            rows={4}
            defaultValue={defaultMessage ?? t("inquiry.message_default")}
            className={`${inputCls} resize-none pt-3`}
          />
        </div>
      </div>

      <div className="mt-8">
        <ConsentCheckbox
          id="inq-consent"
          checked={consent.given}
          onChange={consent.set}
          showError={consent.error}
        />
      </div>

      {status === "error" ? (
        <div className="mt-4 text-sm text-destructive">{t("inquiry.error")}</div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-10 inline-flex h-12 items-center justify-center bg-primary px-8 text-[11px] uppercase tracking-[0.18em] text-primary-foreground transition-opacity duration-300 hover:opacity-85 disabled:opacity-60"
      >
        {status === "submitting" ? t("inquiry.submitting") : t("inquiry.submit")}
      </button>
    </form>
  );
}
