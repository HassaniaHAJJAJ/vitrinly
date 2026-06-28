"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { getBuyerSession } from "@/lib/buyer-auth";
import { awardPoints } from "@/lib/loyalty";

export async function awardOrderPoints(orderId: string, shopId: string, shopSlug: string) {
  const account = await getBuyerSession(shopSlug);
  console.log("[awardPoints] account:", account?.email ?? "null");
  if (!account) return;

  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select("buyer_email, buyer_account_id")
    .eq("id", orderId)
    .single();

  console.log("[awardPoints] order:", order?.buyer_email, "| account_id déjà set:", !!order?.buyer_account_id, "| error:", error?.message);

  if (!order || order.buyer_account_id) return;

  if (order.buyer_email.toLowerCase() !== account.email.toLowerCase()) {
    console.log("[awardPoints] emails ne correspondent pas:", order.buyer_email, "vs", account.email);
    return;
  }

  await admin.from("orders").update({ buyer_account_id: account.id }).eq("id", orderId);
  await awardPoints(account.id, shopId, 5);
  console.log("[awardPoints] 5 points crédités à", account.email);
}
