"use server";

import { requireSeller } from "@/lib/supabase/require-seller";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function deleteProductImage(imageId: string) {
  const { shopId } = await requireSeller();
  const admin = createAdminClient();

  // Vérifie que l'image appartient bien à un produit de cette boutique
  const { data: image } = await admin
    .from("product_images")
    .select("id, url, product_id, products!inner(shop_id)")
    .eq("id", imageId)
    .single();

  if (!image || (image.products as { shop_id: string }).shop_id !== shopId) return;

  await admin.from("product_images").delete().eq("id", imageId);

  // Supprime aussi le fichier du storage
  const url = image.url as string;
  const marker = "/shop-assets/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
    await admin.storage.from("shop-assets").remove([path]);
  }
}
