import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartLink } from "./CartLink";

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, slug, logo_url, primary_color, title_color, text_color, background_color, whatsapp_number"
    )
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price, product_images(url, position)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <CartLink shopSlug={shop.slug} accentColor={shop.primary_color} />

      <header className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        {shop.logo_url && (
          <Image
            src={shop.logo_url}
            alt={shop.name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
            priority
          />
        )}
        <h1 className="text-3xl font-bold" style={{ color: shop.title_color }}>
          {shop.name}
        </h1>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {!products || products.length === 0 ? (
          <p className="text-center opacity-70">Aucun produit pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => {
              const sortedImages = [...(product.product_images ?? [])].sort(
                (a, b) => a.position - b.position
              );
              const thumbnail = sortedImages[0]?.url;

              return (
                <Link
                  key={product.id}
                  href={`/boutique/${shop.slug}/produit/${product.slug}`}
                  className="flex flex-col gap-2"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-black/5">
                    {thumbnail && (
                      <Image
                        src={thumbnail}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 50vw"
                        className="object-cover transition-transform hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm font-semibold" style={{ color: shop.primary_color }}>
                      {product.price} €
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {shop.whatsapp_number && (
        <footer className="border-t px-4 py-6 text-center" style={{ borderColor: shop.primary_color }}>
          <a
            href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium underline"
            style={{ color: shop.primary_color }}
          >
            Nous contacter sur WhatsApp
          </a>
        </footer>
      )}
    </div>
  );
}
