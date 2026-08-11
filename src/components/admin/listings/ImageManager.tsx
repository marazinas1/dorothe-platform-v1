import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  ORIGINALS_BUCKET,
  originalPath,
} from "@/lib/listings/media-paths";
import {
  deleteListingImage,
  enqueueImageProcessing,
} from "@/lib/listings/media.functions";
import { reorderListingImages } from "@/lib/listings/admin.functions";
import { FormSection } from "./FieldRow";
import { ImageCard, type ImageRecord } from "./ImageCard";
import { fileExtension } from "./listing-image-url";

const UNFINISHED = new Set(["pending", "processing"]);

export function ImageManager({
  listingId,
  images,
  refresh,
  onSaveDraft,
  savingDraft,
}: {
  listingId: string | null;
  images: ImageRecord[];
  refresh: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Poll while the edge function is still working on any image.
  const pending = images.some((i) => UNFINISHED.has(i.processing_status));
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [pending, refresh]);

  if (!listingId) {
    return (
      <FormSection title={t("admin.listings.sections.images")}>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 font-heading text-base">
            {t("admin.listings.images.saveFirstTitle")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.listings.images.saveFirstHelp")}
          </p>
          <Button type="button" className="mt-4" onClick={onSaveDraft} disabled={savingDraft}>
            {savingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("admin.listings.saveDraft")}
          </Button>
        </div>
      </FormSection>
    );
  }

  async function uploadFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const imageId = crypto.randomUUID();
        const contentType = file.type || "image/jpeg";
        const path = originalPath(listingId!, imageId, fileExtension(file.name, contentType));

        // The raw original goes to the PRIVATE originals bucket; only the
        // processed AVIF/WebP variants ever land in the public bucket.
        const { error: uploadError } = await supabase.storage
          .from(ORIGINALS_BUCKET)
          .upload(path, file, { contentType, upsert: true });
        if (uploadError) throw new Error(uploadError.message);

        await enqueueImageProcessing({
          data: {
            listingId: listingId!,
            imageId,
            originalStoragePath: path,
            contentType,
            originalSizeBytes: file.size,
            filename: file.name.slice(0, 255),
          },
        });
      }
      toast.success(t("admin.listings.images.uploaded"));
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function retry(image: ImageRecord) {
    if (!image.original_storage_path) {
      toast.error(t("admin.listings.images.retryImpossible"));
      return;
    }
    setBusy(true);
    try {
      await enqueueImageProcessing({
        data: {
          listingId: listingId!,
          imageId: image.id,
          originalStoragePath: image.original_storage_path,
          contentType: image.content_type ?? "image/jpeg",
        },
      });
      toast.success(t("admin.listings.images.retryQueued"));
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove(image: ImageRecord) {
    setBusy(true);
    try {
      await deleteListingImage({ data: { imageId: image.id } });
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  /** Cover image = first in the gallery, which is what is_primary tracks. */
  async function makeCover(image: ImageRecord) {
    const rest = images.filter((i) => i.id !== image.id);
    setBusy(true);
    try {
      await reorderListingImages({
        data: { listingId: listingId!, order: [image.id, ...rest.map((i) => i.id)] },
      });
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    try {
      await reorderListingImages({
        data: { listingId: listingId!, order: next.map((i) => i.id) },
      });
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSection
      title={t("admin.listings.sections.images")}
      description={t("admin.listings.images.coverHint")}
    >
      <div
        className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {t("admin.listings.images.pipelineNote")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.listings.images.dropHintLong")}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t("admin.listings.images.select")}
        </Button>
      </div>

      {images.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              index={index}
              total={images.length}
              busy={busy}
              onMove={move}
              onMakeCover={makeCover}
              onRetry={retry}
              onDelete={remove}
            />
          ))}
        </div>
      ) : null}
    </FormSection>
  );
}
