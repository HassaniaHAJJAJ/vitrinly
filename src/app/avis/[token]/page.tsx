import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { ReviewForm } from "./ReviewForm";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: review } = await admin
    .from("reviews")
    .select("id, status, buyer_name, product_id, products(name, product_images(url, position)), shops(name, logo_url, primary_color, background_color, text_color)")
    .eq("token", token)
    .single();

  if (!review) notFound();

  // Avis déjà soumis ou approuvé
  if (review.status === "pending" || review.status === "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-4xl mb-4">✅</p>
          <h1 className="text-xl font-semibold mb-2">Avis déjà envoyé</h1>
          <p className="text-gray-500 text-sm">Tu as déjà laissé un avis pour ce produit. Merci !</p>
        </div>
      </div>
    );
  }

  if (review.status === "rejected") notFound();

  const shop = Array.isArray(review.shops) ? review.shops[0] : review.shops;
  const product = Array.isArray(review.products) ? review.products[0] : review.products;
  const images = [...((product as any)?.product_images ?? [])].sort((a: any, b: any) => a.position - b.position);
  const thumbnail = images[0]?.url;

  return (
    <div
      className="min-h-screen px-4 py-12"
      style={{ backgroundColor: shop?.background_color ?? "#fff", color: shop?.text_color ?? "#111" }}
    >
      <div className="mx-auto max-w-md">
        {/* En-tête boutique */}
        <div className="mb-8 text-center">
          {shop?.logo_url && (
            <img src={shop.logo_url} alt={shop.name} className="h-14 w-14 rounded-full object-cover mx-auto mb-2" />
          )}
          <p className="text-sm font-medium opacity-60">{shop?.name}</p>
        </div>

        {/* Produit */}
        <div className="flex items-center gap-3 mb-8 rounded-lg border p-3">
          {thumbnail && (
            <img src={thumbnail} alt={(product as any)?.name} className="h-16 w-16 rounded object-cover flex-shrink-0" />
          )}
          <div>
            <p className="text-xs opacity-50 mb-0.5">Tu as acheté</p>
            <p className="font-medium text-sm">{(product as any)?.name}</p>
          </div>
        </div>

        <ReviewForm
          reviewId={review.id}
          buyerName={review.buyer_name}
          accentColor={shop?.primary_color ?? "#111"}
        />
      </div>
    </div>
  );
}
