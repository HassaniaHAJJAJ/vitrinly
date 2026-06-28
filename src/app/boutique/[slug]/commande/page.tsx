import { BackLink } from "@/components/BackLink";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./CheckoutForm";
import { getBuyerSession } from "@/lib/buyer-auth";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const account = await getBuyerSession(slug);

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "slug, name, primary_color, title_color, text_color, background_color, mondial_relay_price, chronopost_price, stripe_onboarding_complete"
    )
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
        <BackLink href={`/boutique/${shop.slug}/panier`}>Mon panier</BackLink>

        <h1 className="mb-6 mt-2 text-2xl font-bold" style={{ color: shop.title_color }}>
          Passer commande
        </h1>

        <CheckoutForm
          shopSlug={shop.slug}
          accentColor={shop.primary_color}
          shippingOptions={{
            mondial_relay: shop.mondial_relay_price,
            chronopost: shop.chronopost_price,
          }}
          stripeAvailable={shop.stripe_onboarding_complete}
          initialBuyer={account ? {
            firstname: account.firstname,
            name: account.lastname,
            email: account.email,
            phone: account.phone ?? "",
            address: account.address ?? "",
            zip: account.zip ?? "",
            city: account.city ?? "",
          } : undefined}
        />
      </main>
    </div>
  );
}
