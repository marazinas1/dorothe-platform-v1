import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { variantUrl } from "./listing-image-url";

export type ImageRecord = {
  id: string;
  variants: unknown;
  processing_status: string;
  processing_error: string | null;
  is_primary: boolean;
  original_storage_path: string | null;
  content_type: string | null;
};

export function ImageCard({
  image,
  index,
  total,
  busy,
  savingOrder,
  onMove,
  onMoveTo,
  onMakeCover,
  onDelete,
}: {
  image: ImageRecord;
  index: number;
  total: number;
  busy: boolean;
  savingOrder?: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  /** Drop target: move the dragged photo to exactly this position. */
  onMoveTo: (from: number, to: number) => void;
  onMakeCover: (image: ImageRecord) => void;
  onDelete: (image: ImageRecord) => void;
}) {
  const { t } = useTranslation();
  const url = variantUrl(image.variants, "card");
  // Reordering is local and debounced, so the arrows stay usable while saving.
  const disabled = busy;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer.getData("text/plain"));
        if (Number.isNaN(from) || from === index) return;
        onMoveTo(from, index);
      }}
      aria-busy={savingOrder ? true : undefined}
    >

      <div className="relative aspect-[4/3] bg-muted">
        {url ? (
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
            {t(`admin.listings.images.status.${image.processing_status}`)}
          </div>
        )}
        {index === 0 ? (
          <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            {t("admin.listings.images.cover")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="mt-auto flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={busy || index === 0}
            onClick={() => onMove(index, -1)}
            aria-label={t("admin.listings.images.moveLeft")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={busy || index === total - 1}
            onClick={() => onMove(index, 1)}
            aria-label={t("admin.listings.images.moveRight")}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          {index !== 0 ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={busy}
              onClick={() => onMakeCover(image)}
              aria-label={t("admin.listings.images.makeCover")}
              title={t("admin.listings.images.makeCover")}
            >
              <Star className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="ml-auto text-destructive"
            disabled={busy}
            onClick={() => onDelete(image)}
            aria-label={t("admin.listings.images.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
