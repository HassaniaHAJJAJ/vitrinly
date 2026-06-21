"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function updateShop(shopId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const primaryColor = String(formData.get("primary_color") ?? "#000000");
  const titleColor = String(formData.get("title_color") ?? "#000000");
  const textColor = String(formData.get("text_color") ?? "#1f1f1f");
  const backgroundColor = String(formData.get("background_color") ?? "#ffffff");
  const paypalEmail = String(formData.get("paypal_email") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const logo = formData.get("logo");

  if (!name || !slug) {
    redirect(`/admin/boutiques/${shopId}?error=missing_fields`);
  }

  const admin = createAdminClient();

  let logoUrl: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    const path = `${slug}/logo-${Date.now()}-${logo.name}`;
    const { error: uploadError } = await admin.storage
      .from("shop-assets")
      .upload(path, logo, { contentType: logo.type });

    if (uploadError) {
      redirect(`/admin/boutiques/${shopId}?error=logo_upload`);
    }

    logoUrl = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
  }

  const { error: updateError } = await admin
    .from("shops")
    .update({
      name,
      slug,
      primary_color: primaryColor,
      title_color: titleColor,
      text_color: textColor,
      background_color: backgroundColor,
      paypal_email: paypalEmail || null,
      whatsapp_number: whatsappNumber || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", shopId);

  if (updateError) {
    redirect(
      `/admin/boutiques/${shopId}?error=${updateError.code === "23505" ? "slug_taken" : "shop"}`
    );
  }

  redirect("/admin");
}
