import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, AlertTriangle } from "lucide-react";

/**
 * Shell for one work queue group. It owns the three states a group can be in —
 * loading, failed, empty — so an empty group reads as a finished job rather than
 * as a hole in the page, and one failing group never hides the others.
 */
export function QueueGroup({
  titleKey,
  count,
  shown,
  loading,
  failed,
  emptyKey,
  footer,
  children,
}: {
  titleKey: string;
  count: number;
  shown: number;
  loading: boolean;
  failed: boolean;
  emptyKey: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const hidden = Math.max(count - shown, 0);

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h3 className="font-heading text-base">{t(titleKey)}</h3>
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
        ) : count > 0 ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
      </header>

      <div className="px-4 py-3">
        {failed ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            {t("admin.dashboard.queue.failed")}
          </p>
        ) : loading ? (
          <div className="grid gap-2" aria-hidden>
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        ) : count === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary" aria-hidden />
            {t(emptyKey)}
          </p>
        ) : (
          <>
            {children}
            {hidden > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("admin.dashboard.queue.more", { count: hidden })}
              </p>
            ) : null}
            {footer ? <div className="mt-3 text-sm">{footer}</div> : null}
          </>
        )}
      </div>
    </section>
  );
}
