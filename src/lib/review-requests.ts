"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { sendReviewRequestEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const FIRST_DELAY_DAYS = 5;
const SECOND_DELAY_DAYS = 15; // après le premier

export async function processPendingReviewRequests(shopId: string) {
  const admin = createAdminClient();
  const now = new Date();

  // --- Email 1 : commandes de +5 jours, aucune demande encore envoyée ---
  const firstThreshold = new Date(now);
  firstThreshold.setDate(firstThreshold.getDate() - FIRST_DELAY_DAYS);

  const { data: firstBatch } = await admin
    .from("orders")
    .select("id, buyer_email, buyer_firstname, order_items(product_name), shops(name, logo_url)")
    .eq("shop_id", shopId)
    .eq("review_requests_sent", 0)
    .eq("review_requests_cancelled", false)
    .lte("created_at", firstThreshold.toISOString());

  // --- Email 2 : premier email envoyé il y a +15 jours ---
  const secondThreshold = new Date(now);
  secondThreshold.setDate(secondThreshold.getDate() - SECOND_DELAY_DAYS);

  const { data: secondBatch } = await admin
    .from("orders")
    .select("id, buyer_email, buyer_firstname, order_items(product_name), shops(name, logo_url)")
    .eq("shop_id", shopId)
    .eq("review_requests_sent", 1)
    .eq("review_requests_cancelled", false)
    .lte("review_requested_at", secondThreshold.toISOString());

  const batches = [
    { orders: firstBatch ?? [], isReminder: false, nextCount: 1 },
    { orders: secondBatch ?? [], isReminder: true, nextCount: 2 },
  ];

  for (const { orders, isReminder, nextCount } of batches) {
    for (const order of orders) {
      const shop = Array.isArray(order.shops) ? order.shops[0] : order.shops;
      const items = order.order_items ?? [];

      // Crée ou récupère les tokens pour chaque produit de la commande
      const products: { name: string; token: string; imageUrl?: string | null }[] = [];

      for (const item of items) {
        // Cherche le produit par nom dans cette boutique
        const { data: product } = await admin
          .from("products")
          .select("id, product_images(url, position)")
          .eq("shop_id", shopId)
          .eq("name", item.product_name)
          .single();

        if (!product) continue;

        const productImages = [...((product as any).product_images ?? [])].sort(
          (a: any, b: any) => a.position - b.position
        );
        const imageUrl = productImages[0]?.url ?? null;

        // Upsert : crée le review si pas encore existant
        const { data: review } = await admin
          .from("reviews")
          .upsert(
            {
              product_id: product.id,
              shop_id: shopId,
              order_id: order.id,
              buyer_email: order.buyer_email,
              buyer_name: order.buyer_firstname,
              rating: 5, // valeur par défaut, sera écrasée
              status: "invited",
            },
            { onConflict: "product_id,buyer_email", ignoreDuplicates: true }
          )
          .select("token")
          .single();

        // Si upsert a ignoré (doublon), récupère le token existant
        const { data: existing } = review
          ? { data: review }
          : await admin
              .from("reviews")
              .select("token")
              .eq("product_id", product.id)
              .eq("buyer_email", order.buyer_email)
              .single();

        if (existing?.token) {
          products.push({ name: item.product_name, token: existing.token, imageUrl });
        }
      }

      if (products.length === 0) continue;

      await sendReviewRequestEmail({
        buyerEmail: order.buyer_email,
        buyerFirstname: order.buyer_firstname,
        shopName: shop?.name ?? "",
        shopLogoUrl: shop?.logo_url ?? null,
        products,
        siteUrl: SITE_URL,
        isReminder,
      });

      await admin
        .from("orders")
        .update({
          review_requests_sent: nextCount,
          review_requested_at: nextCount === 1 ? now.toISOString() : undefined,
        })
        .eq("id", order.id);
    }
  }
}
