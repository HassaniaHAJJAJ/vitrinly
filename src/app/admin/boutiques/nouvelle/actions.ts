"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function createShop(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const primaryColor = String(formData.get("primary_color") ?? "#000000");
  const paypalEmail = String(formData.get("paypal_email") ?? "").trim();
  const whatsappNumber = String(formData.get("whatsapp_number") ?? "").trim();
  const sellerEmail = String(formData.get("seller_email") ?? "").trim();
  const sellerPassword = String(formData.get("seller_password") ?? "");
  const logo = formData.get("logo");

  if (!name || !slug || !sellerEmail || !sellerPassword) {
    redirect("/admin/boutiques/nouvelle?error=missing_fields");
  }

  const admin = createAdminClient();

  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    const path = `${slug}/logo-${Date.now()}-${logo.name}`;
    const { error: uploadError } = await admin.storage
      .from("shop-assets")
      .upload(path, logo, { contentType: logo.type });

    if (uploadError) {
      redirect("/admin/boutiques/nouvelle?error=logo_upload");
    }

    logoUrl = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
  }

  const { data: shop, error: shopError } = await admin
    .from("shops")
    .insert({
      name,
      slug,
      primary_color: primaryColor,
      paypal_email: paypalEmail || null,
      whatsapp_number: whatsappNumber || null,
      logo_url: logoUrl,
    })
    .select("id")
    .single();

  if (shopError || !shop) {
    redirect(
      `/admin/boutiques/nouvelle?error=${shopError?.code === "23505" ? "slug_taken" : "shop"}`
    );
  }

  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email: sellerEmail,
    password: sellerPassword,
    email_confirm: true,
  });

  if (userError || !createdUser.user) {
    redirect("/admin/boutiques/nouvelle?error=seller_account");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: createdUser.user.id,
    shop_id: shop.id,
    role: "seller",
  });

  if (profileError) {
    redirect("/admin/boutiques/nouvelle?error=seller_profile");
  }

  redirect("/admin");
}
