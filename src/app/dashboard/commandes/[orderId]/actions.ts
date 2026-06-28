"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/supabase/require-seller";
import { sendTrackingEmail } from "@/lib/email";

export async function updateTrackingNumber(orderId: string, formData: FormData) {
  const { supabase, shopId } = await requireSeller();
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();
  const notify = formData.get("notify_buyer") === "on";

  await supabase
    .from("orders")
    .update({ tracking_number: trackingNumber || null })
    .eq("id", orderId)
    .eq("shop_id", shopId);

  if (notify && trackingNumber) {
    const { data: order } = await supabase
      .from("orders")
      .select("order_number, buyer_email, buyer_firstname, shops(name, logo_url)")
      .eq("id", orderId)
      .single();

    if (order) {
      const shop = Array.isArray(order.shops) ? order.shops[0] : order.shops;
      await sendTrackingEmail({
        buyerEmail: order.buyer_email,
        buyerFirstname: order.buyer_firstname,
        orderNumber: order.order_number,
        shopName: shop?.name ?? "",
        shopLogoUrl: shop?.logo_url ?? null,
        trackingNumber,
      });
    }
  }

  revalidatePath(`/dashboard/commandes/${orderId}`);
}

export async function cancelReviewRequests(orderId: string) {
  const { supabase, shopId } = await requireSeller();

  await supabase
    .from("orders")
    .update({ review_requests_cancelled: true })
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
