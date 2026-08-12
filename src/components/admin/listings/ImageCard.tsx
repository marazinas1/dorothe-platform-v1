import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, GripVertical, Star, Trash2 } from "lucide-react";

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

/**
 * A compact tile: the photograph, its position in the order, a drag handle, and
 * actions that appear on hover or keyboard focus instead of taking permanent
 * space. Upload, reorder and persistence behaviour is unchanged — this is
 * layout only.
 */
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
      className="group relative overflow-hidden rounded-md border border-border bg-card focus-within:ring-2 focus-within:ring-ring"
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
          <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
            {t(`admin.listings.images.status.${image.processing_status}`)}
          </div>
        )}

        {/* Position and grab point: the order is what is being edited. */}
        <span
          className="absolute left-1 top-1 flex cursor-grab items-center gap-0.5 rounded bg-background/85 px-1 py-0.5 text-[10px] font-medium text-foreground"
          title={t("admin.listings.images.dragHandle")}
        >
          <GripVertical className="h-3 w-3" aria-hidden />
          {index + 1}
        </span>

        {index === 0 ? (
          <span className="absolute right-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            {t("admin.listings.images.cover")}
          </span>
        ) : null}

        {/* Actions: hidden until hover or keyboard focus, always reachable. */}
        <div className="absolute inset-x-1 bottom-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            disabled={disabled || index === 0}
            onClick={() => onMove(index, -1)}
            aria-label={t("admin.listings.images.moveLeft")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            disabled={disabled || index === total - 1}
            onClick={() => onMove(index, 1)}
            aria-label={t("admin.listings.images.moveRight")}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          {index !== 0 ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              disabled={busy}
              onClick={() => onMakeCover(image)}
              aria-label={t("admin.listings.images.makeCover")}
              title={t("admin.listings.images.makeCover")}
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="ml-auto h-7 w-7 text-destructive"
            disabled={busy}
            onClick={() => onDelete(image)}
            aria-label={t("admin.listings.images.delete")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
