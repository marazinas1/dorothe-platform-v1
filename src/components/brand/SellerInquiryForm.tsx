import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ConsentCheckbox } from "@/components/public/ConsentCheckbox";
import { useConsent } from "@/lib/inquiry/use-consent";

import { submitSellerInquiry } from "@/lib/inquiry/submit.functions";

const inputCls =
  "w-full border-0 border-b border-border bg-transparent px-0 py-3 text-sm text-foreground outline-none transition-colors duration-300 focus:border-foreground";
const labelCls =
  "block text-[11px] uppercase tracking-[0.16em] text-muted-foreground";

const MAX_PHOTOS = 4;
const MAX_BYTES = 3 * 1024 * 1024;

export function SellerInquiryForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error" | "too_large"
  >("idle");
  const [files, setFiles] = useState<File[]>([]);
  const consent = useConsent();

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
    if (list.some((f) => f.size > MAX_BYTES)) {
      setStatus("too_large");
      return;
    }
    setStatus("idle");
    setFiles(list);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!consent.check()) return;
    setStatus("submitting");
    try {
      const photos = await Promise.all(
        files.map(async (f) => ({
          filename: f.name,
          content_type: f.type || "application/octet-stream",
          data_base64: await fileToBase64(f),
        })),
      );
      await submitSellerInquiry({
        data: {
          name: String(fd.get("name") ?? ""),
          email: String(fd.get("email") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          message: String(fd.get("message") ?? ""),
          property_type: String(fd.get("property_type") ?? ""),
          address_street: String(fd.get("address_street") ?? ""),
          address_zip: String(fd.get("address_zip") ?? ""),
          address_city: String(fd.get("address_city") ?? ""),
          living_area: numOrNull(fd.get("living_area")),
          rooms: numOrNull(fd.get("rooms")),
          year_built: numOrNull(fd.get("year_built")),
          condition: String(fd.get("condition") ?? ""),
          photos: photos.length ? photos : undefined,
          consent: true,
          locale: consent.locale,
        },
      });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      setFiles([]);
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
          <label className={labelCls} htmlFor="seller-type">
            {t("inquiry.seller.property_type")}
          </label>
          <select id="seller-type" name="property_type" className={inputCls} defaultValue="">
            <option value="">{t("listings.filters.any")}</option>
            <option value="house">{t("listings.filters.house")}</option>
            <option value="apartment">{t("listings.filters.apartment")}</option>
            <option value="land">{t("listings.filters.land")}</option>
            <option value="commercial">{t("listings.filters.commercial")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="seller-condition">
            {t("inquiry.seller.condition")}
          </label>
          <input id="seller-condition" name="condition" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="seller-street">
            {t("inquiry.seller.address_street")}
          </label>
          <input id="seller-street" name="address_street" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="seller-zip">
            {t("inquiry.seller.address_zip")}
          </label>
          <input id="seller-zip" name="address_zip" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="seller-city">
            {t("inquiry.seller.address_city")}
          </label>
          <input id="seller-city" name="address_city" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="seller-area">
            {t("inquiry.seller.living_area")}
          </label>
          <input id="seller-area" name="living_area" type="number" min="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="seller-rooms">
            {t("inquiry.seller.rooms")}
          </label>
          <input id="seller-rooms" name="rooms" type="number" min="0" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="seller-year">
            {t("inquiry.seller.year_built")}
          </label>
          <input id="seller-year" name="year_built" type="number" min="1800" max="2100" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="seller-photos">
          {t("inquiry.seller.photos")}
        </label>
        <input
          id="seller-photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          onChange={onFiles}
          className="mt-3 block w-full text-sm text-muted-foreground file:mr-4 file:border-0 file:bg-primary file:px-4 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.16em] file:text-primary-foreground"
        />
        {files.length > 0 ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {t("inquiry.seller.photos_selected").replace("{{n}}", String(files.length))}
          </div>
        ) : null}
        {status === "too_large" ? (
          <div className="mt-2 text-xs text-destructive">{t("inquiry.seller.photo_too_large")}</div>
        ) : null}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="seller-name">{t("inquiry.name")}</label>
          <input id="seller-name" name="name" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="seller-email">{t("inquiry.email")}</label>
          <input id="seller-email" name="email" type="email" required className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="seller-phone">{t("inquiry.phone")}</label>
          <input id="seller-phone" name="phone" className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls} htmlFor="seller-message">{t("inquiry.message")}</label>
          <textarea id="seller-message" name="message" rows={3} className={`${inputCls} resize-none pt-3`} />
        </div>
      </div>

      <ConsentCheckbox
        id="seller-consent"
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
        {status === "submitting" ? t("inquiry.submitting") : t("inquiry.seller.submit")}
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
