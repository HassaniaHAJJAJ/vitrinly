"use server";

import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/supabase/require-seller";
import { createAdminClient } from "@/lib/supabase/admin-client";

function parsePrice(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

export async function updateShop(formData: FormData) {
  const { shopId } = await requireSeller();

  const primaryColor = String(formData.get("primary_color") ?? "#000000");
  const titleColor = String(formData.get("title_color") ?? "#000000");
  const textColor = String(formData.get("text_color") ?? "#1f1f1f");
  const backgroundColor = String(formData.get("background_color") ?? "#ffffff");
  const paypalEmail = String(formData.get("paypal_email") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const mondialRelayPrice = parsePrice(formData.get("mondial_relay_price"));
  const chronopostPrice = parsePrice(formData.get("chronopost_price"));
  const logo = formData.get("logo");

  const admin = createAdminClient();

  const { data: shop } = await admin.from("shops").select("slug").eq("id", shopId).single();

  let logoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0 && shop) {
    const path = `${shop.slug}/logo-${Date.now()}-${logo.name}`;
    const { error: uploadError } = await admin.storage
      .from("shop-assets")
      .upload(path, logo, { contentType: logo.type });

    if (uploadError) {
      redirect("/dashboard/boutique?error=logo_upload");
    }

    logoUrl = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
  }

  const { error: updateError } = await admin
    .from("shops")
    .update({
      primary_color: primaryColor,
      title_color: titleColor,
      text_color: textColor,
      background_color: backgroundColor,
      paypal_email: paypalEmail || null,
      whatsapp_number: whatsappNumber || null,
      mondial_relay_price: mondialRelayPrice,
      chronopost_price: chronopostPrice,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", shopId);

  if (updateError) {
    redirect("/dashboard/boutique?error=shop");
  }

  redirect("/dashboard/boutique?saved=1");
}
