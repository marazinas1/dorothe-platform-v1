import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A brand-new install has nothing to work through, and an empty work queue would
 * read as "all done" when the truth is "nothing exists yet". This panel says so
 * and points at the one action that matters.
 */
export function FirstRun({ locale }: { locale: string }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-lg border border-dashed border-border bg-muted/20 p-6">
      <h2 className="font-heading text-lg">{t("admin.dashboard.firstRun.title")}</h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        {t("admin.dashboard.firstRun.body")}
      </p>
      <Button asChild className="mt-4">
        <Link to="/$locale/admin/listings/new" params={{ locale }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.dashboard.firstRun.cta")}
        </Link>
      </Button>
    </section>
  );
}
