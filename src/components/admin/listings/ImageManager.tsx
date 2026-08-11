import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImagePlus, Loader2, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { processImageFile } from "@/lib/images/optimize";
import {
  IMAGES_BUCKET,
  ORIGINALS_BUCKET,
  originalPath,
  publicImageUrl,
  variantPath,
  type VariantsJson,
} from "@/lib/listings/media-paths";
import {
  deleteListingImage,
  recordListingImage,
} from "@/lib/listings/media.functions";
import { reorderListingImages } from "@/lib/listings/admin.functions";
import { FormSection } from "./FieldRow";
import { ImageCard, type ImageRecord } from "./ImageCard";
import { fileExtension } from "./listing-image-url";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Job = { id: string; name: string; error: string | null };

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const inputRef = useRef<HTMLInputElement>(null);

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

  /**
   * One photo, start to finish, in the browser: resize + WebP encode, upload
   * the variants to the public bucket, the untouched original to the private
   * one, then write the row. Nothing is persisted before the files exist.
   */
  async function processOne(jobId: string, file: File) {
    const imageId = jobId;
    const processed = await processImageFile(file);

    const variants: VariantsJson = {};
    for (const variant of processed.variants) {
      const path = variantPath(listingId!, imageId, variant.key);
      const { error } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(path, variant.blob, { contentType: "image/webp", upsert: true });
      if (error) throw new Error(error.message);
      variants[variant.key] = {
        path,
        url: publicImageUrl(SUPABASE_URL, path),
        width: variant.width,
        height: variant.height,
        bytes: variant.blob.size,
      };
    }

    // The raw original is kept privately so variants can be regenerated.
    const contentType = file.type || "image/jpeg";
    const original = originalPath(
      listingId!,
      imageId,
      fileExtension(file.name, contentType),
    );
    const { error: originalError } = await supabase.storage
      .from(ORIGINALS_BUCKET)
      .upload(original, file, { contentType, upsert: true });
    if (originalError) throw new Error(originalError.message);

    await recordListingImage({
      data: {
        listingId: listingId!,
        imageId,
        originalStoragePath: original,
        contentType,
        originalSizeBytes: file.size,
        filename: file.name.slice(0, 255),
        variants,
        width: processed.width,
        height: processed.height,
        blurhash: processed.blurhash,
      },
    });
  }

  async function runJob(jobId: string, file: File) {
    filesRef.current.set(jobId, file);
    setJobs((prev) => [
      ...prev.filter((j) => j.id !== jobId),
      { id: jobId, name: file.name, error: null },
    ]);
    try {
      await processOne(jobId, file);
      filesRef.current.delete(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, error: message } : j)),
      );
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await runJob(crypto.randomUUID(), file);
      }
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

  const compact = images.length > 0;

  return (
    <FormSection
      title={t("admin.listings.sections.images")}
      description={t("admin.listings.images.coverHint")}
    >
      <div
        className={`rounded-lg border border-dashed border-border bg-muted/20 ${
          compact
            ? "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
            : "px-4 py-4 text-left"
        }`}
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
        <div className={compact ? "min-w-0" : "flex flex-wrap items-center justify-between gap-3"}>
          <p className="text-sm text-muted-foreground">
            {t("admin.listings.images.dropHintLong")}
          </p>
          {compact ? null : (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("admin.listings.images.select")}
            </Button>
          )}
        </div>
        {compact ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("admin.listings.images.select")}
          </Button>
        ) : (
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {t("admin.listings.images.pipelineNote")}
          </p>
        )}
      </div>


      {jobs.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {job.error ? null : <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              <span className="truncate">{job.name}</span>
              <span
                className={`truncate text-xs ${
                  job.error ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {job.error ?? t("admin.listings.images.status.processing")}
              </span>
              {job.error ? (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const file = filesRef.current.get(job.id);
                      if (file) void runJob(job.id, file);
                    }}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    {t("admin.listings.images.retry")}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t("admin.listings.images.dismiss")}
                    onClick={() => {
                      filesRef.current.delete(job.id);
                      setJobs((prev) => prev.filter((j) => j.id !== job.id));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

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
              onDelete={remove}
            />
          ))}
        </div>
      ) : null}
    </FormSection>
  );
}
