import { BackLink } from "@/components/BackLink";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartForm } from "./AddToCartForm";
import { CartLink } from "../../CartLink";
import { WhatsAppButton } from "../../WhatsAppButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: productSlug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, slug, name, primary_color, title_color, text_color, background_color, whatsapp_number")
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price, product_images(url, position), variants(id, size, color, stock)"
    )
    .eq("slug", productSlug)
    .eq("shop_id", shop.id)
    .single();

  if (!product) {
    notFound();
  }

  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, buyer_name, rating, comment, submitted_at")
    .eq("product_id", product.id)
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <CartLink shopSlug={shop.slug} accentColor={shop.primary_color} />
      {shop.whatsapp_number && (
        <WhatsAppButton number={shop.whatsapp_number} shopName={shop.name} />
      )}

      <main className="mx-auto max-w-4xl px-4 py-10">
        <BackLink href={`/boutique/${shop.slug}`}>{shop.name}</BackLink>

        <div className="mt-4 flex flex-col gap-2 md:hidden">
          <h1 className="text-2xl font-bold" style={{ color: shop.title_color }}>{product.name}</h1>
          <p className="text-xl font-semibold" style={{ color: shop.primary_color }}>{product.price} €</p>
        </div>

        <AddToCartForm
          shopSlug={shop.slug}
          productId={product.id}
          name={product.name}
          price={product.price}
          images={images}
          variants={product.variants ?? []}
          accentColor={shop.primary_color}
          titleColor={shop.title_color}
          description={product.description ?? null}
        />
        {/* Avis clients */}
        {reviews && reviews.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4" style={{ color: shop.title_color }}>
              Avis clients ({reviews.length})
            </h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-lg border p-4" style={{ borderColor: `${shop.primary_color}20` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{r.buyer_name}</span>
                    <span className="text-yellow-400 text-sm">
                      {"★".repeat(r.rating)}
                      <span style={{ opacity: 0.2 }}>{"★".repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm leading-relaxed" style={{ opacity: 0.75 }}>{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
