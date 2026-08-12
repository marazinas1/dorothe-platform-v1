// Shared status mutation used by the edit form and the listings table.
// The database owns the rules (flow, publish permission, country energy
// validation); its message is translated into a human sentence so a failed
// publish states the reason without leaking Postgres wording.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  adminListingsQueryOptions,
  changeListingStatus,
} from "@/lib/listings/admin.functions";
import type { ListingStatus } from "@/lib/listings/admin-schema";
import { formatPublishError } from "@/lib/listings/publish-error";

export function useStatusChange(onChanged?: () => void) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply(id: string, next: ListingStatus) {
    setBusy(next);
    setError(null);
    try {
      await changeListingStatus({ data: { id, status: next } });
      await queryClient.invalidateQueries(adminListingsQueryOptions);
      onChanged?.();
      toast.success(t("admin.listings.statusChanged"));
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = formatPublishError(t, raw);
      setError(message);
      toast.error(message);
      if (import.meta.env.DEV) console.error("status change failed:", raw);
    } finally {
      setBusy(null);
    }
  }

  return { apply, busy, error, setError };
}
