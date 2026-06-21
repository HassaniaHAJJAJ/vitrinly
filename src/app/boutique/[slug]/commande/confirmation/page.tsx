import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { slug } = await params;
  const { order: orderId } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, slug, name, primary_color, title_color, text_color, background_color")
    .eq("slug", slug)
    .single();

  if (!shop) {
    notFound();
  }

  // Buyers aren't authenticated, so RLS blocks the anon client from reading
  // orders. The order id (UUID, unguessable) is enough to safely look it up
  // here for the confirmation page only.
  const admin = createAdminClient();
  const { data: order } = orderId
    ? await admin
        .from("orders")
        .select(
          "id, buyer_firstname, buyer_name, buyer_email, total_price, shipping_method, shipping_price, created_at, order_items(product_name, size, color, quantity, unit_price)"
        )
        .eq("id", orderId)
        .eq("shop_id", shop.id)
        .single()
    : { data: null };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold" style={{ color: shop.title_color }}>
          Merci {order?.buyer_firstname} 🎉
        </h1>
        <p className="mt-2 opacity-70">
          Ta commande a bien été reçue. {shop.name} va la préparer rapidement.
        </p>

        {order && (
          <div className="mt-8 rounded border p-4 text-left">
            <ul className="flex flex-col gap-2 border-b pb-4">
              {order.order_items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>
                    {item.product_name} ({item.size} / {item.color}) × {item.quantity}
                  </span>
                  <span>{(item.unit_price * item.quantity).toFixed(2)} €</span>
                </li>
              ))}
              {order.shipping_method && (
                <li className="flex justify-between text-sm">
                  <span>
                    Livraison ({order.shipping_method === "mondial_relay" ? "Mondial Relay" : "Chronopost"})
                  </span>
                  <span>{order.shipping_price.toFixed(2)} €</span>
                </li>
              )}
            </ul>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span style={{ color: shop.primary_color }}>{order.total_price.toFixed(2)} €</span>
            </div>
          </div>
        )}

        <Link
          href={`/boutique/${shop.slug}`}
          className="mt-8 inline-block rounded px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: shop.primary_color }}
        >
          Retour à la boutique
        </Link>
      </main>
    </div>
  );
}
