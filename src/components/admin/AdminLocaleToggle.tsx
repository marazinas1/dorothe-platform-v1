import { useTranslation } from "react-i18next";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { MESSAGE_LOCALES, type Locale } from "@/i18n/config";
import { setAdminLocale } from "@/lib/auth/admin-locale.functions";
import { cn } from "@/lib/utils";

/**
 * Interface language of the panel — a per-user preference stored on the profile,
 * not a navigation. It is unrelated to the content language of the website and
 * only offers the languages we ship message files for.
 */
export function AdminLocaleToggle({ current }: { current: Locale }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function choose(locale: Locale) {
    if (locale === current || busy) return;
    setBusy(true);
    try {
      await setAdminLocale({ data: { locale } });
      // Re-runs the admin gate, so the resolved interface language comes from
      // the stored profile rather than from local state.
      await router.invalidate();
    } catch {
      toast.error(t("admin.topbar.interfaceLanguageFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="group"
      aria-label={t("admin.topbar.interfaceLanguage")}
      title={t("admin.topbar.interfaceLanguageHint")}
      className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
    >
      {MESSAGE_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          disabled={busy}
          aria-pressed={loc === current}
          onClick={() => void choose(loc)}
          className={cn(
            "rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide transition-colors disabled:opacity-60",
            loc === current
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
