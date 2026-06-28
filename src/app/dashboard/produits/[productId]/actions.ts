"use server";

import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/supabase/require-seller";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { safeFilename } from "@/lib/slugify";

export async function updateProduct(productId: string, formData: FormData) {
  const { shopId } = await requireSeller();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const newPhotos = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const imagesToDelete = formData.getAll("delete_images[]").map(String);
  const sizes = formData.getAll("sizes[]").map(String);
  const colors = formData.getAll("colors[]").map(String);
  const stocks = formData.getAll("stocks[]").map(Number);

  if (!name || !Number.isFinite(price) || price < 0) {
    redirect(`/dashboard/produits/${productId}?error=missing_fields`);
  }

  const admin = createAdminClient();

  // Vérifier que le produit appartient bien à cette boutique
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("shop_id", shopId)
    .single();

  if (!existing) {
    redirect("/dashboard/produits");
  }

  const { error: updateError } = await admin
    .from("products")
    .update({ name, description: description || null, price })
    .eq("id", productId);

  if (updateError) {
    redirect(`/dashboard/produits/${productId}?error=product`);
  }

  if (imagesToDelete.length > 0) {
    await admin.from("product_images").delete().in("id", imagesToDelete);
  }

  if (newPhotos.length > 0) {
    const { count } = await admin
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const startPosition = count ?? 0;
    const imageRows = [];
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      const path = `${shopId}/products/${productId}/${Date.now()}-${i}-${safeFilename(photo.name)}`;
      const { error: uploadError } = await admin.storage
        .from("shop-assets")
        .upload(path, photo, { contentType: photo.type });

      if (uploadError) continue;

      const url = admin.storage.from("shop-assets").getPublicUrl(path).data.publicUrl;
      imageRows.push({ product_id: productId, url, position: startPosition + i });
    }

    if (imageRows.length > 0) {
      await admin.from("product_images").insert(imageRows);
    }
  }

  await admin.from("variants").delete().eq("product_id", productId);

  const variantRows = sizes
    .map((size, i) => ({
      product_id: productId,
      size,
      color: colors[i] ?? "",
      stock: Number.isFinite(stocks[i]) ? stocks[i] : 0,
    }))
    .filter((v) => v.size || v.color);

  if (variantRows.length > 0) {
    await admin.from("variants").insert(variantRows);
  }

  redirect("/dashboard/produits");
}

export async function deleteProduct(productId: string) {
  const { shopId } = await requireSeller();

  const admin = createAdminClient();

  // Vérifier que le produit appartient bien à cette boutique
  const { data: existing } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("shop_id", shopId)
    .single();

  if (!existing) {
    redirect("/dashboard/produits");
  }

  await admin.from("products").delete().eq("id", productId);

  redirect("/dashboard/produits");
}
