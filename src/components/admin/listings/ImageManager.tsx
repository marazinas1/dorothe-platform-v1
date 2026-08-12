import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, RotateCcw, Upload, X } from "lucide-react";

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
import { FormSection } from "./FieldRow";
import { ImageCard, type ImageRecord } from "./ImageCard";
import { fileExtension } from "./listing-image-url";
import { useImageOrder } from "./use-image-order";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type Job = { id: string; name: string; error: string | null };

export function ImageManager({
  listingId,
  images,
  refresh,
  ensureListingId,
}: {
  listingId: string | null;
  images: ImageRecord[];
  refresh: () => void;
  /** Creates the draft row on demand; uploads wait for it before attaching. */
  ensureListingId: () => Promise<string>;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const filesRef = useRef(new Map<string, File>());
  const inputRef = useRef<HTMLInputElement>(null);

  // Order is held locally while arranging and persisted with a debounce, so a
  // refresh arriving mid-save cannot snap the tiles back.
  const { ordered, move, moveTo, makeCover, savingOrder } = useImageOrder({
    listingId,
    images,
    refresh,
    onError: (message) => toast.error(message),
  });

  /**
   * One photo, start to finish, in the browser: resize + WebP encode, upload
   * the variants to the public bucket, the untouched original to the private
   * one, then write the row. Nothing is persisted before the files exist.
   */
  async function processOne(listingId: string, jobId: string, file: File) {
    const imageId = jobId;
    const processed = await processImageFile(file);

    const variants: VariantsJson = {};
    for (const variant of processed.variants) {
      const path = variantPath(listingId, imageId, variant.key);
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
      listingId,
      imageId,
      fileExtension(file.name, contentType),
    );
    const { error: originalError } = await supabase.storage
      .from(ORIGINALS_BUCKET)
      .upload(original, file, { contentType, upsert: true });
    if (originalError) throw new Error(originalError.message);

    await recordListingImage({
      data: {
        listingId: listingId,
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

  async function runJob(listingId: string, jobId: string, file: File) {
    filesRef.current.set(jobId, file);
    setJobs((prev) => [
      ...prev.filter((j) => j.id !== jobId),
      { id: jobId, name: file.name, error: null },
    ]);
    try {
      await processOne(listingId, jobId, file);
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
      // Dropping photos is a meaningful action: the row is created here if the
      // listing does not exist yet, so the pipeline itself stays unchanged.
      const id = listingId ?? (await ensureListingId());
      for (const file of Array.from(files)) {
        await runJob(id, crypto.randomUUID(), file);
      }
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


  return (
    <FormSection
      anchor="photos"
      title={t("admin.listings.sections.images")}
      description={t("admin.listings.images.uploadHint")}
    >
      {/* The technical detail is demoted: brokers need one line, not a paragraph. */}
      <details className="mb-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer">{t("admin.listings.images.technicalTitle")}</summary>
        <p className="mt-1 leading-relaxed">{t("admin.listings.images.technicalNote")}</p>
      </details>

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

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
        } disabled:cursor-progress`}
      >
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-7 w-7 text-muted-foreground" />
        )}
        <span className="mt-2 font-heading text-base text-foreground">
          {t("admin.listings.images.dropzoneTitle")}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("admin.listings.images.dropzoneMeta")}
        </span>
      </button>



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
                      if (file && listingId) void runJob(listingId, job.id, file);
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

      {ordered.length > 0 ? (
        <>
          <p className="mt-4 text-xs text-muted-foreground">
            {t("admin.listings.images.coverHint")}
          </p>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ordered.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                total={ordered.length}
                busy={busy}
                savingOrder={savingOrder}
                onMove={move}
                onMoveTo={moveTo}
                onMakeCover={makeCover}
                onDelete={remove}
              />
            ))}
          </div>
        </>
      ) : jobs.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
          {t("admin.listings.images.empty")}
        </div>
      ) : null}

    </FormSection>
  );
}
