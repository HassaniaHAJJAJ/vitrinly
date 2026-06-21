import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";

export default async function ShopProductsAdminPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const { supabase } = await requireAdmin();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug")
    .eq("id", shopId)
    .single();

  if (!shop) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, product_images(url, position)")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-sm text-gray-500 underline">
        ← Toutes les boutiques
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits — {shop.name}</h1>
        <Link
          href={`/admin/boutiques/${shop.id}/produits/nouveau`}
          className="rounded bg-black px-4 py-2 text-sm text-white"
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
                  href={`/admin/boutiques/${shop.id}/produits/${product.id}`}
                  className="flex items-center gap-4 rounded border px-4 py-3 hover:bg-gray-50"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                    {thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnail}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
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
