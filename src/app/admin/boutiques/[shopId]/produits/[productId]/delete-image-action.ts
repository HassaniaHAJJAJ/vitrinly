"use server";

import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";

export async function deleteProductImageAdmin(imageId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: image } = await admin
    .from("product_images")
    .select("id, url")
    .eq("id", imageId)
    .single();

  if (!image) return;

  await admin.from("product_images").delete().eq("id", imageId);

  const url = image.url as string;
  const marker = "/shop-assets/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const path = decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
    await admin.storage.from("shop-assets").remove([path]);
  }
}
