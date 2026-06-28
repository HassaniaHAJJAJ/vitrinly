"use server";

import { revalidatePath } from "next/cache";
import { requireSeller } from "@/lib/supabase/require-seller";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { awardPoints, getBuyerAccountByEmail } from "@/lib/loyalty";

export async function approveReview(formData: FormData) {
  const { shopId } = await requireSeller();
  const reviewId = formData.get("reviewId") as string;
  const admin = createAdminClient();

  const { data: review } = await admin
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", reviewId)
    .eq("shop_id", shopId)
    .select("buyer_email")
    .single();

  // Créditer 3 points si la cliente a un compte
  if (review?.buyer_email) {
    const buyerAccountId = await getBuyerAccountByEmail(review.buyer_email, shopId);
    if (buyerAccountId) await awardPoints(buyerAccountId, shopId, 3);
  }

  revalidatePath("/dashboard/avis");
}

export async function rejectReview(formData: FormData) {
  const { shopId } = await requireSeller();
  const reviewId = formData.get("reviewId") as string;
  const admin = createAdminClient();

  await admin
    .from("reviews")
    .update({ status: "rejected" })
    .eq("id", reviewId)
    .eq("shop_id", shopId);

  revalidatePath("/dashboard/avis");
}

export async function republishReview(formData: FormData) {
  const { shopId } = await requireSeller();
  const reviewId = formData.get("reviewId") as string;
  const admin = createAdminClient();

  await admin
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", reviewId)
    .eq("shop_id", shopId)
    .eq("status", "rejected");

  revalidatePath("/dashboard/avis");
}

export async function unpublishReview(formData: FormData) {
  const { shopId } = await requireSeller();
  const reviewId = formData.get("reviewId") as string;
  const admin = createAdminClient();

  await admin
    .from("reviews")
    .update({ status: "rejected" })
    .eq("id", reviewId)
    .eq("shop_id", shopId)
    .eq("status", "approved");

  revalidatePath("/dashboard/avis");
}
