import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { pickLocalized } from "@/lib/listings/format";
import { inquiryQueueQueryOptions } from "@/lib/dashboard/admin.functions";
import { inquiryTypeKey } from "@/lib/inquiries/types";
import { ageLabel } from "@/lib/dashboard/age";
import type { Locale } from "@/i18n/config";
import { QueueGroup } from "./QueueGroup";

/**
 * Enquiries that nobody has closed out yet — "new" and "read" both count,
 * because opening a message is not the same as answering it. Oldest first: the
 * one that has been waiting longest is the one that matters.
 */
export function InquiryQueue({ locale }: { locale: string }) {
  const { t } = useTranslation();
  const query = useQuery(inquiryQueueQueryOptions);
  const data = query.data;

  return (
    <QueueGroup
      titleKey="admin.dashboard.queue.inquiries.title"
      emptyKey="admin.dashboard.queue.inquiries.empty"
      count={data?.total ?? 0}
      shown={data?.items.length ?? 0}
      loading={query.isPending}
      failed={query.isError}
      footer={
        <Link
          to="/$locale/admin/inquiries"
          params={{ locale }}
          className="text-primary underline-offset-4 hover:underline"
        >
          {t("admin.dashboard.queue.inquiries.all")}
        </Link>
      }
    >
      <ul className="grid gap-1">
        {(data?.items ?? []).map((item) => {
          const age = ageLabel(item.created_at);
          return (
            <li key={item.id}>
              <Link
                to="/$locale/admin/inquiries/$id"
                params={{ locale, id: item.id }}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted"
              >
                <span
                  className={
                    item.status === "new"
                      ? "h-1.5 w-1.5 shrink-0 self-center rounded-full bg-primary"
                      : "h-1.5 w-1.5 shrink-0 self-center rounded-full bg-muted-foreground/40"
                  }
                  aria-hidden
                />
                <span className="font-medium">{item.name?.trim() || item.email}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`admin.inquiries.types.${inquiryTypeKey(item.type)}`)}
                </span>
                {item.listing ? (
                  <span className="text-xs text-muted-foreground">
                    ·{" "}
                    {pickLocalized(item.listing.title, locale as Locale) || item.listing.slug}
                  </span>
                ) : null}
                {age ? (
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {t(age.key, { count: age.count })}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </QueueGroup>
  );
}
