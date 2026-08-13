import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ListingInquiryInput = z.object({
  listing_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(4000),
  consent: z.literal(true),
  locale: z.string().trim().max(10).optional(),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => ListingInquiryInput.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { consentColumns } = await import("./consent.server");
    const consent = await consentColumns(data.locale);
    const { error } = await supabaseAdmin.from("inquiries").insert({
      ...consent,
      listing_id: data.listing_id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      source: "public_web",
      type: "listing",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const BuyerInquiryInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  property_type: z.string().trim().max(50).optional().or(z.literal("")),
  city: z.string().trim().max(200).optional().or(z.literal("")),
  rooms_min: z.number().nullable().optional(),
  area_min: z.number().nullable().optional(),
  price_max: z.number().nullable().optional(),
  consent: z.literal(true),
  locale: z.string().trim().max(10).optional(),
});

export const submitBuyerInquiry = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => BuyerInquiryInput.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { consentColumns } = await import("./consent.server");
    const { name, email, phone, message, consent: _c, locale, ...criteria } = data;
    const consent = await consentColumns(locale);
    const { error } = await supabaseAdmin.from("inquiries").insert({
      ...consent,
      listing_id: null,
      type: "buyer",
      name,
      email,
      phone: phone || null,
      message: message || null,
      payload: criteria,
      source: "public_web",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SellerPhotoInput = z.object({
  filename: z.string().max(200),
  content_type: z.string().max(100),
  data_base64: z.string().max(6_000_000), // ~4.4 MB decoded
});

const SellerInquiryInput = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  property_type: z.string().trim().max(50).optional().or(z.literal("")),
  address_street: z.string().trim().max(200).optional().or(z.literal("")),
  address_zip: z.string().trim().max(20).optional().or(z.literal("")),
  address_city: z.string().trim().max(200).optional().or(z.literal("")),
  living_area: z.number().nullable().optional(),
  rooms: z.number().nullable().optional(),
  year_built: z.number().nullable().optional(),
  condition: z.string().trim().max(200).optional().or(z.literal("")),
  photos: z.array(SellerPhotoInput).max(4).optional(),
  consent: z.literal(true),
  locale: z.string().trim().max(10).optional(),
});

export const submitSellerInquiry = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => SellerInquiryInput.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { consentColumns } = await import("./consent.server");
    const { name, email, phone, message, photos, consent: _c, locale, ...criteria } = data;
    const consent = await consentColumns(locale);

    const photo_paths: string[] = [];
    if (photos && photos.length > 0) {
      const folder = crypto.randomUUID();
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]!;
        const ext = (p.filename.split(".").pop() ?? "jpg").toLowerCase().slice(0, 6);
        const path = `${folder}/${i}.${ext}`;
        const bytes = Buffer.from(p.data_base64, "base64");
        const { error: upErr } = await supabaseAdmin.storage
          .from("seller-photos")
          .upload(path, bytes, {
            contentType: p.content_type || "application/octet-stream",
            upsert: false,
          });
        if (upErr) throw new Error(upErr.message);
        photo_paths.push(path);
      }
    }

    const { error } = await supabaseAdmin.from("inquiries").insert({
      ...consent,
      listing_id: null,
      type: "seller",
      name,
      email,
      phone: phone || null,
      message: message || null,
      payload: criteria,
      photo_paths,
      source: "public_web",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
