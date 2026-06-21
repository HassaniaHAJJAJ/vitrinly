"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/supabase/require-seller";

export async function updateTrackingNumber(orderId: string, formData: FormData) {
  const { supabase, shopId } = await requireSeller();
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();

  await supabase
    .from("orders")
    .update({ tracking_number: trackingNumber || null })
    .eq("id", orderId)
    .eq("shop_id", shopId);

  revalidatePath(`/dashboard/commandes/${orderId}`);
}

export async function markOrderProcessed(orderId: string) {
  const { supabase, shopId } = await requireSeller();

  await supabase
    .from("orders")
    .update({ status: "processed", processed_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("shop_id", shopId);

  revalidatePath(`/dashboard/commandes/${orderId}`);
  revalidatePath("/dashboard");
}
