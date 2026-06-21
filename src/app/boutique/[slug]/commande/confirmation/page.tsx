import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { ClearCartOnMount } from "./ClearCartOnMount";
import { formatOrderNumber } from "@/lib/order-number";

const ORDER_COLUMNS =
  "id, order_number, buyer_firstname, buyer_name, buyer_email, total_price, shipping_method, shipping_price, created_at, order_items(product_name, size, color, quantity, unit_price)";

async function findOrder(shopId: string, orderId?: string, sessionId?: string) {
  const admin = createAdminClient();

  if (orderId) {
    const { data } = await admin
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", orderId)
      .eq("shop_id", shopId)
      .single();
    return data;
  }

  if (!sessionId) return null;

  // The Stripe webhook creates the order asynchronously and may land a
  // moment after the buyer is redirected back here, so retry briefly.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await admin
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("stripe_session_id", sessionId)
      .eq("shop_id", shopId)
      .maybeSingle();

    if (data) return data;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return null;
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string; session_id?: string }>;
}) {
  const { slug } = await params;
  const { order: orderId, session_id: sessionId } = await searchParams;
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
  // orders. The order id / Stripe session id (both unguessable) are enough
  // to safely look the order up here for the confirmation page only.
  const order = await findOrder(shop.id, orderId, sessionId);
  const stillProcessing = !order && Boolean(sessionId);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: shop.background_color, color: shop.text_color }}
    >
      <ClearCartOnMount shopSlug={shop.slug} />

      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <h1 className="text-2xl font-bold" style={{ color: shop.title_color }}>
          Merci {order?.buyer_firstname} 🎉
        </h1>
        {order && (
          <p className="mt-1 text-sm opacity-70">
            Commande {formatOrderNumber(order.order_number, order.created_at)}
          </p>
        )}
        <p className="mt-2 opacity-70">
          {stillProcessing
            ? "Ton paiement a bien été reçu, ta commande est en cours d'enregistrement — actualise la page dans quelques secondes."
            : `Ta commande a bien été reçue. ${shop.name} va la préparer rapidement.`}
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
