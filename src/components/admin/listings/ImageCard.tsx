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
 * A compact tile: the photograph, its position in the order, a grab affordance,
 * and actions that appear on hover or keyboard focus. Reordering is a pointer
 * gesture owned by the grid, so this component only renders the drag states it
 * is told about.
 */
export function ImageCard({
  image,
  index,
  total,
  busy,
  savingOrder,
  dragging,
  isDragged,
  isTarget,
  onPointerDown,
  onMove,
  onMakeCover,
  onDelete,
}: {
  image: ImageRecord;
  index: number;
  total: number;
  busy: boolean;
  savingOrder?: boolean;
  /** A reorder gesture is in progress somewhere in the grid. */
  dragging?: boolean;
  isDragged?: boolean;
  isTarget?: boolean;
  onPointerDown: (index: number, event: React.PointerEvent) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onMakeCover: (image: ImageRecord) => void;
  onDelete: (image: ImageRecord) => void;
}) {
  const { t } = useTranslation();
  const url = variantUrl(image.variants, "card");
  // Reordering is local and debounced, so the arrows stay usable while saving.
  const disabled = busy;

  return (
    <div
      data-photo-index={index}
      onPointerDown={(e) => onPointerDown(index, e)}
      className={`group relative select-none overflow-hidden rounded-lg border-2 bg-card transition-[transform,opacity,box-shadow] focus-within:ring-2 focus-within:ring-ring ${
        isDragged
          ? "z-10 scale-[1.03] border-primary opacity-70 shadow-lg"
          : isTarget
            ? "border-primary ring-2 ring-primary"
            : index === 0
              ? "border-primary ring-2 ring-primary/40"
              : "border-border"
      } ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={dragging ? { touchAction: "none" } : undefined}
      aria-busy={savingOrder ? true : undefined}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {url ? (
          <img
            src={url}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
            {t(`admin.listings.images.status.${image.processing_status}`)}
          </div>
        )}

        {/* Position and grab point: the order is what is being edited. */}
        <span
          className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-background/85 px-1 py-0.5 text-[10px] font-medium text-foreground"
          title={t("admin.listings.images.dragHandle")}
        >
          <GripVertical className="h-3 w-3" aria-hidden />
          {index + 1}
        </span>

        {index === 0 && !isTarget ? (
          <span className="absolute right-1 top-1 rounded bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-foreground shadow-sm">
            {t("admin.listings.images.cover")}
          </span>
        ) : null}

        {/* Where the photo will land, shown before releasing. */}
        {isTarget ? (
          <span className="absolute inset-x-1 top-1 flex justify-end">
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              {t("admin.listings.images.dropHere", { position: index + 1 })}
            </span>
          </span>
        ) : null}

        {/* Actions: hidden until hover or keyboard focus, always reachable. */}
        <div
          className={`absolute inset-x-1 bottom-1 flex items-center gap-1 transition-opacity group-focus-within:opacity-100 ${
            dragging ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          }`}
        >
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
