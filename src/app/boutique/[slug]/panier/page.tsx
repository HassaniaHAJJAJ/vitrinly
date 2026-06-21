import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartView } from "./CartView";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("slug, name, primary_color, title_color, text_color, background_color")
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link href={`/boutique/${shop.slug}`} className="text-sm underline opacity-70">
          ← {shop.name}
        </Link>

        <h1 className="mb-6 mt-2 text-2xl font-bold" style={{ color: shop.title_color }}>
          Mon panier
        </h1>

        <CartView shopSlug={shop.slug} accentColor={shop.primary_color} />
      </main>
    </div>
  );
}
