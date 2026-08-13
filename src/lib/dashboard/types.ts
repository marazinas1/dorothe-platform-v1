// Shapes the dashboard renders. Client-safe: no Supabase, no server imports.
import type { Json } from "@/lib/inquiries/types";

/** Every queue group reports how much it holds, not only what it shows. */
export interface QueueResult<T> {
  items: T[];
  total: number;
}

export interface QueueInquiryItem {
  id: string;
  type: string;
  status: "new" | "read";
  name: string | null;
  email: string;
  created_at: string;
  listing: { slug: string; title: Json } | null;
}

/** One thing to fix, with the form anchor that fixes it. */
export interface QueueReason {
  key: string;
  anchor: string;
  /** Named sub-fields (energy certificate fields), when the reason has them. */
  missing?: string[];
}

export interface QueueListingItem {
  id: string;
  slug: string;
  title: Json;
  status: string;
  reasons: QueueReason[];
  /** Timestamp the group sorts and labels by (published_at or updated_at). */
  since: string | null;
}

export interface DashboardMetrics {
  listingsByStatus: Record<string, number>;
  inquiriesByType: Record<string, number>;
  closed: { sold: number; rented: number };
  /** Average time from enquiry arrival to being marked handled, in the period. */
  processing: { sample: number; avgSeconds: number | null };
  totalListings: number;
}

/** How many rows a group shows before it points at the full list. */
export const QUEUE_LIMIT = 6;

/** Days a live listing may sit without a single enquiry before we mention it. */
export const STALE_ACTIVE_DAYS = 60;
