"use server";

import { redirect } from "next/navigation";
import { requireSeller } from "@/lib/supabase/require-seller";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { slugify } from "@/lib/slugify";

async function generateUniqueProductSlug(
  admin: ReturnType<typeof createAdminClient>,
  shopId: string,
  name: string
) {
  const base = slugify(name) || "produit";
  const { data: existing } = await admin
    .from("products")
    .select("slug")
    .eq("shop_id", shopId)
    .like("slug", `${base}%`);

  const taken = new Set((existing ?? []).map((p) => p.slug));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}

export async function createProduct(formData: FormData) {
  const { shopId } = await requireSeller();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = Number(formData.get("price"));
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const sizes = formData.getAll("sizes[]").map(String);
  const colors = formData.getAll("colors[]").map(String);
  const stocks = formData.getAll("stocks[]").map(Number);

  if (!name || !Number.isFinite(price) || price < 0) {
    redirect("/dashboard/produits/nouveau?error=missing_fields");
  }

  const admin = createAdminClient();

  const productId = crypto.randomUUID();
  const slug = await generateUniqueProductSlug(admin, shopId, name);

  const { data: product, error: productError } = await admin
    .from("products")
    .insert({ id: productId, shop_id: shopId, name, description: description || null, price, slug })
    .select("id")
    .single();

  if (productError || !product) {
    redirect("/dashboard/produits/nouveau?error=product");
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

  redirect("/dashboard/produits");
}
