"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  const headerColor = String(formData.get("header_color") ?? "#f3f4f6");
  const logo = formData.get("logo");
  const headerImage = formData.get("header_image");
  const legalMentions = String(formData.get("legal_mentions") ?? "").trim();
  const cgv = String(formData.get("cgv") ?? "").trim();
  const privacyPolicy = String(formData.get("privacy_policy") ?? "").trim();

  const admin = createAdminClient();

  const { data: shop } = await admin.from("shops").select("slug").eq("id", shopId).single();

  let logoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0 && shop) {
    const path = `${shop.slug}/logo-${Date.now()}-${logo.name}`;
    const { error: uploadError } = await admin.storage
      .from("shop-assets")
      .upload(path, logo, { contentType: logo.type });

    if (uploadError) redirect("/dashboard/boutique?error=logo_upload");

    logoUrl = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
  }

  let headerImageUrl: string | undefined;
  if (headerImage instanceof File && headerImage.size > 0 && shop) {
    const path = `${shop.slug}/header-${Date.now()}-${headerImage.name}`;
    const { error: uploadError } = await admin.storage
      .from("shop-assets")
      .upload(path, headerImage, { contentType: headerImage.type });

    if (uploadError) redirect("/dashboard/boutique?error=header_upload");

    headerImageUrl = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
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
      header_color: headerColor,
      legal_mentions: legalMentions || null,
      cgv: cgv || null,
      privacy_policy: privacyPolicy || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
      ...(headerImageUrl ? { header_image_url: headerImageUrl } : {}),
    })
    .eq("id", shopId);

  if (updateError) redirect("/dashboard/boutique?error=shop");

  if (shop) revalidatePath(`/boutique/${shop.slug}`);
  redirect("/dashboard/boutique?saved=1");
}
