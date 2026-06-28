import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartLink } from "./CartLink";
import { ShopFilters } from "./ShopFilters";
import { filterByPrice } from "./price-ranges";
import { inferCategory } from "@/lib/infer-category";
import { WhatsAppButton } from "./WhatsAppButton";
import { Suspense } from "react";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categorie?: string; prix?: string }>;
}) {
  const { slug } = await params;
  const { categorie, prix } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, slug, logo_url, header_image_url, header_color, primary_color, title_color, text_color, background_color, whatsapp_number, legal_mentions, cgv, privacy_policy"
    )
    .eq("slug", slug)
    .single();

  if (!shop) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, price, product_images(url, position)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  const productsWithCategory = (products ?? []).map((p) => ({
    ...p,
    category: inferCategory(p.name),
  }));

  const allCategories = [...new Set(
    productsWithCategory.map((p) => p.category).filter((c): c is string => !!c)
  )];

  const filtered = productsWithCategory
    .filter((p) => !categorie || p.category === categorie)
    .filter((p) => filterByPrice(p.price, prix));

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <CartLink shopSlug={shop.slug} accentColor={shop.primary_color} />
      {shop.whatsapp_number && (
        <WhatsAppButton number={shop.whatsapp_number} shopName={shop.name} />
      )}

      <header
        className="flex h-40 w-full items-center justify-center gap-4 px-6 sm:h-56"
        style={
          shop.header_image_url
            ? { backgroundImage: `url(${shop.header_image_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: shop.header_color ?? "#f3f4f6" }
        }
      >
        {shop.logo_url && (
          <Image src={shop.logo_url} alt={shop.name} width={96} height={96}
            className="h-20 w-20 rounded-full object-cover shadow-md" priority />
        )}
        <h1 className="text-3xl font-bold drop-shadow-sm" style={{ color: shop.title_color }}>
          {shop.name}
        </h1>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <Suspense>
          <ShopFilters
            categories={allCategories}
            accentColor={shop.primary_color}
            totalCount={productsWithCategory.length}
            filteredCount={filtered.length}
            activeCategory={categorie ?? ""}
            activePrix={prix ?? ""}
          />
        </Suspense>

        {filtered.length === 0 ? (
          <p className="text-center opacity-70 py-16">Aucun produit ne correspond à ces filtres.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((product) => {
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

      <footer className="mt-8 border-t px-4 py-8" style={{ borderColor: `${shop.primary_color}33` }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
          {shop.whatsapp_number && (
            <a
              href={`https://wa.me/${shop.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline"
              style={{ color: shop.primary_color }}
            >
              Nous contacter sur WhatsApp
            </a>
          )}
          {(shop.legal_mentions || shop.cgv || shop.privacy_policy) && (
            <div className="flex flex-wrap justify-center gap-4 text-xs opacity-60">
              {shop.legal_mentions && (
                <Link href={`/boutique/${shop.slug}/mentions-legales`}>Mentions légales</Link>
              )}
              {shop.cgv && (
                <Link href={`/boutique/${shop.slug}/cgv`}>Conditions générales de vente</Link>
              )}
              {shop.privacy_policy && (
                <Link href={`/boutique/${shop.slug}/confidentialite`}>Politique de confidentialité</Link>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
