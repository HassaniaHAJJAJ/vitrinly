"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";

export async function submitReview({
  reviewId,
  rating,
  comment,
  buyerName,
}: {
  reviewId: string;
  rating: number;
  comment: string;
  buyerName: string;
}) {
  const admin = createAdminClient();

  const { error } = await admin
    .from("reviews")
    .update({
      rating,
      comment: comment || null,
      buyer_name: buyerName,
      status: "pending",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("status", "invited"); // sécurité : ne peut être soumis qu'une fois

  if (error) return { error: "Une erreur est survenue. Réessaie plus tard." };
  return null;
}
