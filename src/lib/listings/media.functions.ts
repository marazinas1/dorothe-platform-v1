// Server functions for the listing media pipeline:
//   - enqueueImageProcessing: caller uploads the ORIGINAL, then invokes this
//     to insert the row and kick off async processing on the edge function.
//   - deleteListingImage: removes every variant plus the original from storage
//     and deletes the DB row.
//   - signListingDocument: issues a short-lived signed URL, gated by edit
//     rights OR (for requires_lead docs) an existing inquiry from that email.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertPermission } from "@/lib/auth/require-permission.server";
import {
  DOCUMENTS_BUCKET,
  IMAGES_BUCKET,
  ORIGINALS_BUCKET,
  imageFolderPrefix,
  VARIANT_FORMATS,
  VARIANT_SPECS,
  variantPath,
} from "./media-paths";

const enqueueSchema = z.object({
  listingId: z.string().uuid(),
  imageId: z.string().uuid(),
  originalStoragePath: z.string().min(1),
  contentType: z.string().min(1).max(120),
  originalSizeBytes: z.number().int().nonnegative().optional(),
  filename: z.string().max(255).optional(),
});

export const enqueueImageProcessing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => enqueueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertEditListing(supabase, userId, data.listingId);

    // Insert / upsert the pending row. storage_path stays empty until a
    // "done" run writes the primary variant path; keep original path here.
    const { error: insertError } = await supabase
      .from("listing_images")
      .upsert(
        {
          id: data.imageId,
          listing_id: data.listingId,
          storage_path: "",
          original_storage_path: data.originalStoragePath,
          content_type: data.contentType,
          original_size_bytes: data.originalSizeBytes ?? null,
          processing_status: "pending",
          processing_error: null,
          processing_started_at: new Date().toISOString(),
          variants: {},
        },
        { onConflict: "id" },
      );
    if (insertError) throw new Response(insertError.message, { status: 400 });

    // Fire the edge function. It returns 202 immediately and processes in
    // the background via EdgeRuntime.waitUntil. A shared secret authenticates
    // the server-to-function hop; verify_jwt is disabled for that function
    // since this header is the gate.
    const edgeSecret = process.env.EDGE_FUNCTION_SECRET;
    if (!edgeSecret) {
      throw new Response("EDGE_FUNCTION_SECRET is not configured", { status: 500 });
    }
    const jobs = VARIANT_FORMATS.flatMap((format) =>
      VARIANT_SPECS.map((variant) => ({ format, variant: variant.key })),
    );
    for (const [index, job] of jobs.entries()) {
      const { error: invokeError } = await supabase.functions.invoke("process-listing-image", {
        headers: { "x-edge-secret": edgeSecret },
        body: {
          listingId: data.listingId,
          imageId: data.imageId,
          originalStoragePath: data.originalStoragePath,
          contentType: data.contentType,
          variant: job.variant,
          format: job.format,
          final: index === jobs.length - 1,
        },
      });
      if (invokeError) {
        await supabase.from("listing_images").update({
          processing_status: "failed",
          processing_error: `processing failed: ${invokeError.message}`,
          processing_started_at: null,
        }).eq("id", data.imageId);
        throw new Response(invokeError.message, { status: 502 });
      }
    }

    return { imageId: data.imageId, status: "done" as const };
  });

const deleteSchema = z.object({ imageId: z.string().uuid() });

export const deleteListingImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: row, error: fetchError } = await supabase
      .from("listing_images")
      .select("id, listing_id, original_storage_path")
      .eq("id", data.imageId)
      .maybeSingle();
    if (fetchError) throw new Response(fetchError.message, { status: 400 });
    if (!row) throw new Response("Not found", { status: 404 });

    await assertEditListing(supabase, userId, row.listing_id);

    // Every variant path is deterministic: listings/{listing}/{image}/{v}.{fmt}
    const variantPaths = VARIANT_SPECS.flatMap((spec) =>
      VARIANT_FORMATS.map((fmt) => variantPath(row.listing_id, row.id, spec.key, fmt)),
    );

    // Also sweep the folder in case an older run stored extras. Best-effort.
    const { data: listed } = await supabase.storage
      .from(IMAGES_BUCKET)
      .list(imageFolderPrefix(row.listing_id, row.id).replace(/\/$/, ""), {
        limit: 100,
      });
    const listedPaths = (listed ?? []).map(
      (o) => `${imageFolderPrefix(row.listing_id, row.id)}${o.name}`,
    );

    const uniquePaths = Array.from(new Set([...variantPaths, ...listedPaths]));
    if (uniquePaths.length > 0) {
      await supabase.storage.from(IMAGES_BUCKET).remove(uniquePaths);
    }

    // Original lives in the private originals bucket.
    if (row.original_storage_path) {
      await supabase.storage
        .from(ORIGINALS_BUCKET)
        .remove([row.original_storage_path]);
    }

    const { error: deleteError } = await supabase
      .from("listing_images")
      .delete()
      .eq("id", row.id);
    if (deleteError) throw new Response(deleteError.message, { status: 400 });

    return { ok: true as const };
  });

const signSchema = z.object({
  documentId: z.string().uuid(),
  email: z.string().email().optional(),
  expiresIn: z.number().int().min(30).max(3600).optional(),
});

export const signListingDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => signSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: doc, error: docError } = await supabase
      .from("listing_documents")
      .select("id, listing_id, storage_path, requires_lead, filename")
      .eq("id", data.documentId)
      .maybeSingle();
    if (docError) throw new Response(docError.message, { status: 400 });
    if (!doc) throw new Response("Not found", { status: 404 });

    // Caller with edit rights on the listing may always download.
    const { data: canEdit } = await supabase.rpc("current_user_has_permission", {
      _key: "listing.edit.any",
    });
    let allowed = canEdit === true;

    if (!allowed) {
      // Non-admin path: require a matching inquiry when the doc is lead-gated.
      if (!doc.requires_lead) {
        allowed = true;
      } else {
        if (!data.email) throw new Response("Email required", { status: 400 });
        const { count, error: inqError } = await supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", doc.listing_id)
          .ilike("email", data.email);
        if (inqError) throw new Response(inqError.message, { status: 400 });
        allowed = (count ?? 0) > 0;
      }
    }

    if (!allowed) throw new Response("Forbidden", { status: 403 });

    const { data: signed, error: signError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(doc.storage_path, data.expiresIn ?? 300, {
        download: doc.filename ?? true,
      });
    if (signError || !signed) {
      throw new Response(signError?.message ?? "Signing failed", { status: 500 });
    }

    return { url: signed.signedUrl, expiresIn: data.expiresIn ?? 300 };
  });

// ---------------------------------------------------------------------------

async function assertEditListing(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  listingId: string,
) {
  // A listing's editability is either global (listing.edit.any) or scoped
  // to own listings (listing.edit.own AND agent_id/created_by = auth.uid()).
  const { data: canAny } = await supabase.rpc("current_user_has_permission", {
    _key: "listing.edit.any",
  });
  if (canAny === true) return;

  await assertPermission(supabase, userId, "listing.edit.own");
  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, agent_id, created_by")
    .eq("id", listingId)
    .maybeSingle();
  if (error) throw new Response(error.message, { status: 400 });
  if (!listing) throw new Response("Not found", { status: 404 });
  if (listing.agent_id !== userId && listing.created_by !== userId) {
    throw new Response("Forbidden", { status: 403 });
  }
}
