import { useTranslation } from "react-i18next";

import { LISTING_QUEUE_KEYS } from "@/lib/dashboard/admin.functions";
import { InquiryQueue } from "./InquiryQueue";
import { ListingQueue } from "./ListingQueue";

/**
 * The work queue: what needs doing, ordered by how badly it needs doing. Each
 * group fetches on its own, so a slow or broken group degrades to its own
 * message instead of taking the page with it.
 */
export function WorkQueue({ locale }: { locale: string }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg">{t("admin.dashboard.queue.heading")}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <InquiryQueue locale={locale} />
        {LISTING_QUEUE_KEYS.map((key) => (
          <ListingQueue key={key} queue={key} locale={locale} />
        ))}
      </div>
    </section>
  );
}
