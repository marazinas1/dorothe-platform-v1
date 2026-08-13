// Lifecycle status presentation + which transitions are offered in the admin.
// Visibility is derived from status alone (no separate published flag), so this
// is the single place that decides what a broker may switch a listing to.
import { allowedTransitions, type ListingStatus } from "./admin-schema";

export type StatusTone = "live" | "progress" | "closed" | "inactive";

export const STATUS_TONE: Record<ListingStatus, StatusTone> = {
  draft: "inactive",
  coming_soon: "live",
  active: "live",
  reserved: "progress",
  sold: "closed",
  rented: "closed",
  archived: "inactive",
};

/** Token-only colouring, so a brand change repaints the list. */
export const TONE_BADGE_CLASS: Record<StatusTone, string> = {
  live: "border-primary/40 bg-primary/10 text-primary",
  progress: "border-accent/60 bg-accent/40 text-accent-foreground",
  closed: "border-border bg-muted text-muted-foreground",
  inactive: "border-dashed border-border bg-transparent text-muted-foreground",
};

export const TONE_DOT_CLASS: Record<StatusTone, string> = {
  live: "bg-primary",
  progress: "bg-accent-foreground/70",
  closed: "bg-muted-foreground/60",
  inactive: "bg-muted-foreground/30",
};

export function statusTone(status: string | null | undefined): StatusTone {
  return STATUS_TONE[(status ?? "draft") as ListingStatus] ?? "inactive";
}

/**
 * Transitions the database allows, minus the ones that contradict the deal type:
 * a sale can never become "rented", a rental can never become "sold".
 */
export function statusOptionsFor(
  status: string | null | undefined,
  dealType: string | null | undefined,
): ListingStatus[] {
  return allowedTransitions(status).filter((target) => {
    if (target === "sold") return dealType !== "rent";
    if (target === "rented") return dealType === "rent";
    return true;
  });
}

/** Statuses the public policy exposes; used to decide checklist enforcement. */
export const PUBLIC_STATUSES: ListingStatus[] = [
  "active",
  "coming_soon",
  "reserved",
  "sold",
  "rented",
];

export function isPublicStatus(status: string): boolean {
  return PUBLIC_STATUSES.includes(status as ListingStatus);
}
