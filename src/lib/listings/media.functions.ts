// Server functions for the listing media pipeline:
//   - recordListingImage: the browser resizes/encodes the variants, uploads
//     them plus the untouched original, then calls this to persist the row.
//     A row is only ever written when the variants already exist, so nothing
//     can get stuck in "processing".
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
  VARIANT_SPECS,
  variantPath,
} from "./media-paths";

const variantEntry = z.object({
  path: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().nonnegative(),
});

const recordSchema = z.object({
  listingId: z.string().uuid(),
  imageId: z.string().uuid(),
  originalStoragePath: z.string().min(1),
  contentType: z.string().min(1).max(120),
  originalSizeBytes: z.number().int().nonnegative().optional(),
  filename: z.string().max(255).optional(),
  variants: z.record(z.enum(["card", "detail", "og"]), variantEntry),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurhash: z.string().max(120).optional(),
});

export const recordListingImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => recordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertEditListing(supabase, userId, data.listingId);

    const primary = data.variants.detail ?? data.variants.card ?? data.variants.og;

    const { error: insertError } = await supabase
      .from("listing_images")
      .upsert(
        {
          id: data.imageId,
          listing_id: data.listingId,
          storage_path: primary?.path ?? "",
          original_storage_path: data.originalStoragePath,
          content_type: "image/webp",
          original_size_bytes: data.originalSizeBytes ?? null,
          processing_status: "done",
          processing_error: null,
          processing_started_at: null,
          variants: data.variants,
          width: data.width,
          height: data.height,
          blurhash: data.blurhash ?? null,
        },
        { onConflict: "id" },
      );
    if (insertError) throw new Error(insertError.message);

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
    if (fetchError) throw new Error(fetchError.message);
    if (!row) throw new Error("Not found");

    await assertEditListing(supabase, userId, row.listing_id);

    // Every variant path is deterministic: listings/{listing}/{image}/{v}.webp
    const variantPaths = VARIANT_SPECS.map((spec) =>
      variantPath(row.listing_id, row.id, spec.key),
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
    if (deleteError) throw new Error(deleteError.message);

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
    if (docError) throw new Error(docError.message);
    if (!doc) throw new Error("Not found");

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
        if (!data.email) throw new Error("Email required");
        const { count, error: inqError } = await supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", doc.listing_id)
          .ilike("email", data.email);
        if (inqError) throw new Error(inqError.message);
        allowed = (count ?? 0) > 0;
      }
    }

    if (!allowed) throw new Error("Forbidden");

    const { data: signed, error: signError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(doc.storage_path, data.expiresIn ?? 300, {
        download: doc.filename ?? true,
      });
    if (signError || !signed) {
      throw new Error(signError?.message ?? "Signing failed");
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
  if (error) throw new Error(error.message);
  if (!listing) throw new Error("Not found");
  if (listing.agent_id !== userId && listing.created_by !== userId) {
    throw new Error("Forbidden");
  }
}
