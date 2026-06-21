import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCartForm } from "./AddToCartForm";
import { CartLink } from "../../CartLink";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id: productSlug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, slug, name, primary_color, title_color, text_color, background_color")
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

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <CartLink shopSlug={shop.slug} accentColor={shop.primary_color} />

      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href={`/boutique/${shop.slug}`}
          className="text-sm underline opacity-70"
        >
          ← {shop.name}
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-black/5">
              {images[0] && (
                <Image
                  src={images[0].url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.slice(1).map((image) => (
                  <Image
                    key={image.url}
                    src={image.url}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-shrink-0 rounded object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold" style={{ color: shop.title_color }}>
              {product.name}
            </h1>
            <p className="text-xl font-semibold" style={{ color: shop.primary_color }}>
              {product.price} €
            </p>

            {product.description && (
              <div
                className="text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            <AddToCartForm
              shopSlug={shop.slug}
              productId={product.id}
              name={product.name}
              price={product.price}
              image={images[0]?.url ?? null}
              variants={product.variants ?? []}
              accentColor={shop.primary_color}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
