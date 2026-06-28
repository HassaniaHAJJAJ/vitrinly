import { requireSeller } from "@/lib/supabase/require-seller";
import { DashboardNav } from "../DashboardNav";
import { approveReview, rejectReview, unpublishReview, republishReview } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin-client";

export default async function ReviewsPage() {
  const { supabase, shopId } = await requireSeller();

  const { data: shop } = await supabase
    .from("shops")
    .select("name, slug, logo_url")
    .eq("id", shopId)
    .single();

  const admin = createAdminClient();
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, buyer_name, rating, comment, status, submitted_at, products(name)")
    .eq("shop_id", shopId)
    .in("status", ["pending", "approved", "rejected"])
    .order("submitted_at", { ascending: false });

  const pending = (reviews ?? []).filter((r) => r.status === "pending");
  const approved = (reviews ?? []).filter((r) => r.status === "approved");
  const rejected = (reviews ?? []).filter((r) => r.status === "rejected");

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <DashboardNav shopName={shop?.name ?? ""} logoUrl={shop?.logo_url} shopSlug={shop?.slug} pendingReviewsCount={pending.length} />

      <h2 className="text-lg font-semibold mb-6">Avis clients</h2>

      {pending.length === 0 && approved.length === 0 && rejected.length === 0 && (
        <p className="text-sm text-gray-500">Aucun avis reçu pour l'instant.</p>
      )}

      {/* En attente */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-medium text-orange-600 mb-3">
            En attente de validation ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((review) => (
              <ReviewCard key={review.id} review={review} actions="pending" />
            ))}
          </div>
        </section>
      )}

      {/* Publiés */}
      {approved.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-medium text-green-600 mb-3">Publiés ({approved.length})</h3>
          <div className="space-y-3">
            {approved.map((review) => (
              <ReviewCard key={review.id} review={review} actions="approved" />
            ))}
          </div>
        </section>
      )}

      {/* Refusés */}
      {rejected.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Refusés ({rejected.length})</h3>
          <div className="space-y-3">
            {rejected.map((review) => (
              <ReviewCard key={review.id} review={review} actions="rejected" />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {"★".repeat(rating)}
      <span className="text-gray-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function ReviewCard({ review, actions }: { review: any; actions: "pending" | "approved" | "rejected" | "none" }) {
  const product = Array.isArray(review.products) ? review.products[0] : review.products;

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-sm font-medium">{review.buyer_name}</p>
          <p className="text-xs text-gray-400">{product?.name}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Stars rating={review.rating} />
          {review.status === "approved" && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publié</span>
          )}
          {review.status === "rejected" && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Refusé</span>
          )}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
      )}
      {!review.comment && (
        <p className="text-xs text-gray-300 italic mt-1">Aucun commentaire</p>
      )}
      {actions === "pending" && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <form action={approveReview}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button type="submit" className="text-xs bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800">
              Publier
            </button>
          </form>
          <form action={rejectReview}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button type="submit" className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded hover:bg-red-50">
              Refuser
            </button>
          </form>
        </div>
      )}
      {actions === "approved" && (
        <div className="mt-3 pt-3 border-t">
          <form action={unpublishReview}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button type="submit" className="text-xs text-gray-400 underline underline-offset-2 hover:text-red-500">
              Retirer la publication
            </button>
          </form>
        </div>
      )}
      {actions === "rejected" && (
        <div className="mt-3 pt-3 border-t">
          <form action={republishReview}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button type="submit" className="text-xs text-gray-400 underline underline-offset-2 hover:text-green-600">
              Republier
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
