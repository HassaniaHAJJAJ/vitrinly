import { BackLink } from "@/components/BackLink";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("name, slug, privacy_policy, primary_color, background_color, text_color")
    .eq("slug", slug)
    .single();

  if (!shop || !shop.privacy_policy) notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <BackLink href={`/boutique/${shop.slug}`}>{shop.name}</BackLink>
        <h1 className="mb-8 mt-4 text-2xl font-bold">Politique de confidentialité</h1>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{shop.privacy_policy}</pre>
      </main>
    </div>
  );
}
