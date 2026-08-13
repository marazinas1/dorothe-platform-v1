import { Link, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import type { Locale } from "@/i18n/config";

type Props = {
  /** Unique per form, so several forms can live on one page. */
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Shown when the visitor submits without ticking. */
  showError?: boolean;
};

/**
 * Data-protection consent for every public form that collects personal data.
 * Unchecked by default, required, and the privacy link opens in a new tab so
 * nothing the visitor typed is lost.
 */
export function ConsentCheckbox({ id, checked, onChange, showError }: Props) {
  const { t } = useTranslation();
  const { locale } = useParams({ strict: false }) as { locale: Locale };

  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          name="consent"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
          aria-describedby={showError ? `${id}-error` : undefined}
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          {t("consent.text")}{" "}
          <Link
            to="/$locale/datenschutz"
            params={{ locale }}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            {t("consent.link")}
          </Link>
        </span>
      </label>
      {showError ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {t("consent.required")}
        </p>
      ) : null}
    </div>
  );
}
