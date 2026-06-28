import Link from "next/link";
import Image from "next/image";
import { requireSeller } from "@/lib/supabase/require-seller";
import { DashboardNav } from "../DashboardNav";

export default async function SellerProductsPage() {
  const { supabase, shopId } = await requireSeller();

  const [{ data: shop }, { count: pendingReviewsCount }] = await Promise.all([
    supabase.from("shops").select("name, slug, logo_url").eq("id", shopId).single(),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "pending"),
  ]);

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, product_images(url, position)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <DashboardNav shopName={shop?.name ?? ""} logoUrl={shop?.logo_url} shopSlug={shop?.slug} pendingReviewsCount={pendingReviewsCount ?? 0} />
      <div className="mb-6 flex justify-end">
        <Link
          href="/dashboard/produits/nouveau"
          className="whitespace-nowrap rounded bg-black px-4 py-2 text-sm text-white"
        >
          Nouveau produit
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <p className="text-gray-500">Aucun produit pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((product) => {
            const sortedImages = [...(product.product_images ?? [])].sort(
              (a, b) => a.position - b.position
            );
            const thumbnail = sortedImages[0]?.url;

            return (
              <li key={product.id}>
                <Link
                  href={`/dashboard/produits/${product.id}`}
                  className="flex items-center gap-4 rounded border px-4 py-3 hover:bg-gray-50"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    {thumbnail && (
                      <Image src={thumbnail} alt={product.name} fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span>{product.name}</span>
                    <span className="text-sm text-gray-500">{product.price} €</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
