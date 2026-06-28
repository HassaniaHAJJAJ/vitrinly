"use server";

import { createAdminClient } from "./supabase/admin-client";

export async function awardPoints(buyerAccountId: string, shopId: string, points: number) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("increment_loyalty_points", {
    p_buyer_account_id: buyerAccountId,
    p_shop_id: shopId,
    p_points: points,
  });
  if (error) console.error("[loyalty] increment_loyalty_points error:", error);
}

export async function getBuyerAccountByEmail(email: string, shopId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("buyer_accounts")
    .select("id")
    .eq("shop_id", shopId)
    .eq("email", email)
    .maybeSingle();
  return data?.id ?? null;
}
