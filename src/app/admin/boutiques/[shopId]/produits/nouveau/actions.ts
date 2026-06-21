"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function createProduct(shopId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const sizes = formData.getAll("sizes[]").map(String);
  const colors = formData.getAll("colors[]").map(String);
  const stocks = formData.getAll("stocks[]").map(Number);

  if (!name || !Number.isFinite(price) || price < 0) {
    redirect(`/admin/boutiques/${shopId}/produits/nouveau?error=missing_fields`);
  }

  const admin = createAdminClient();

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({ shop_id: shopId, name, description: description || null, price })
    .select("id")
    .single();

  if (productError || !product) {
    redirect(`/admin/boutiques/${shopId}/produits/nouveau?error=product`);
  }

  if (photos.length > 0) {
    const imageRows = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const path = `${shopId}/products/${product.id}/${Date.now()}-${i}-${photo.name}`;
      const { error: uploadError } = await admin.storage
        .from("shop-assets")
        .upload(path, photo, { contentType: photo.type });

      if (uploadError) continue;

      const url = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
      imageRows.push({ product_id: product.id, url, position: i });
    }

    if (imageRows.length > 0) {
      await admin.from("product_images").insert(imageRows);
    }
  }

  const variantRows = sizes
    .map((size, i) => ({
      product_id: product.id,
      size,
      color: colors[i] ?? "",
      stock: Number.isFinite(stocks[i]) ? stocks[i] : 0,
    }))
    .filter((v) => v.size && v.color);

  if (variantRows.length > 0) {
    await admin.from("variants").insert(variantRows);
  }

  redirect(`/admin/boutiques/${shopId}/produits`);
}
