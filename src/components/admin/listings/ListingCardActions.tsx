import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Archive, Copy, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminListingsQueryOptions } from "@/lib/listings/admin.functions";
import { deleteListing, duplicateListing } from "@/lib/listings/admin-mutations.functions";
import { statusOptionsFor } from "@/lib/listings/status-options";
import { useStatusChange } from "./use-status-change";

/** Edit (primary) plus an overflow menu: copy public link, duplicate, delete. */
export function ListingCardActions({
  id,
  slug,
  locale,
  status,
  dealType,
}: {
  id: string;
  slug: string;
  locale: string;
  status: string;
  dealType: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { apply } = useStatusChange();
  const canArchive = statusOptionsFor(status, dealType).includes("archived");

  async function copyLink() {
    const url = `${window.location.origin}/${locale}/immobilien/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("admin.listings.actions.linkCopied"));
    } catch {
      toast.error(url);
    }
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await queryClient.invalidateQueries(adminListingsQueryOptions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => navigate({ to: "/$locale/admin/listings/$id", params: { locale, id } })}
      >
        <Pencil className="mr-2 h-3.5 w-3.5" />
        {t("admin.listings.actions.edit")}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            aria-label={t("admin.listings.actions.more")}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => void copyLink()}>
            <Link2 className="mr-2 h-4 w-4" />
            {t("admin.listings.actions.copyLink")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              void run(async () => {
                const created = await duplicateListing({ data: { id } });
                toast.success(t("admin.listings.actions.duplicated"));
                navigate({
                  to: "/$locale/admin/listings/$id",
                  params: { locale, id: created.id },
                });
              })
            }
          >
            <Copy className="mr-2 h-4 w-4" />
            {t("admin.listings.actions.duplicate")}
          </DropdownMenuItem>
          {canArchive ? (
            <DropdownMenuItem onSelect={() => void apply(id, "archived")}>
              <Archive className="mr-2 h-4 w-4" />
              {t("admin.listings.statusAction.archived")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("admin.listings.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.listings.actions.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.listings.actions.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.listings.actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                void run(async () => {
                  await deleteListing({ data: { id } });
                  toast.success(t("admin.listings.actions.deleted"));
                })
              }
            >
              {t("admin.listings.actions.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
