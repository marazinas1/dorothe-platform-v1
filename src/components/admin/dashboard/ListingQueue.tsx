import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { pickLocalized } from "@/lib/listings/format";
import {
  listingQueueQueryOptions,
  type ListingQueueKey,
} from "@/lib/dashboard/admin.functions";
import type { QueueListingItem, QueueReason } from "@/lib/dashboard/types";
import { ageLabel } from "@/lib/dashboard/age";
import type { Locale } from "@/i18n/config";
import { QueueGroup } from "./QueueGroup";

/**
 * One listing-shaped queue group. Every reason is a link straight to the field
 * that resolves it, so the queue is a to-do list and not a report.
 */
export function ListingQueue({
  queue,
  locale,
}: {
  queue: ListingQueueKey;
  locale: string;
}) {
  const query = useQuery(listingQueueQueryOptions(queue));
  const data = query.data;

  return (
    <QueueGroup
      titleKey={`admin.dashboard.queue.${queue}.title`}
      emptyKey={`admin.dashboard.queue.${queue}.empty`}
      count={data?.total ?? 0}
      shown={data?.items.length ?? 0}
      loading={query.isPending}
      failed={query.isError}
    >
      <ul className="grid gap-2">
        {(data?.items ?? []).map((item) => (
          <li key={item.id}>
            <Row item={item} queue={queue} locale={locale} />
          </li>
        ))}
      </ul>
    </QueueGroup>
  );
}

function Row({
  item,
  queue,
  locale,
}: {
  item: QueueListingItem;
  queue: ListingQueueKey;
  locale: string;
}) {
  const { t } = useTranslation();
  const age = ageLabel(item.since);
  const title = pickLocalized(item.title, locale as Locale) || t("admin.listings.untitled");

  return (
    <div className="rounded-md px-1.5 py-1.5 hover:bg-muted">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Link
          to="/$locale/admin/listings/$id"
          params={{ locale, id: item.id }}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          {title}
        </Link>
        {age ? (
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {t(`admin.dashboard.queue.${queue}.since`, { age: t(age.key, { count: age.count }) })}
          </span>
        ) : null}
      </div>
      {item.reasons.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {item.reasons.map((reason) => (
            <ReasonChip
              key={reason.key}
              reason={reason}
              queue={queue}
              locale={locale}
              id={item.id}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReasonChip({
  reason,
  queue,
  locale,
  id,
}: {
  reason: QueueReason;
  queue: ListingQueueKey;
  locale: string;
  id: string;
}) {
  const { t } = useTranslation();
  const base =
    queue === "gaps"
      ? t(`admin.dashboard.gaps.${reason.key}`)
      : t(`admin.listings.checklist.items.${reason.key}`);
  const named = reason.missing?.length
    ? `${base}: ${reason.missing.map((key) => t(`admin.listings.energyFields.${key}`)).join(", ")}`
    : base;

  return (
    <Link
      to="/$locale/admin/listings/$id"
      params={{ locale, id }}
      search={{ field: reason.anchor }}
      className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
    >
      {named}
    </Link>
  );
}
