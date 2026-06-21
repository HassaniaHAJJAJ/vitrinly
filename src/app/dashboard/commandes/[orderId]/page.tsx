import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/supabase/require-seller";
import { updateTrackingNumber, markOrderProcessed } from "./actions";
import { formatOrderNumber } from "@/lib/order-number";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processed: "Traitée",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const { supabase, shopId } = await requireSeller();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, buyer_firstname, buyer_name, buyer_email, buyer_phone, buyer_address, buyer_zip, buyer_city, total_price, shipping_method, shipping_price, status, tracking_number, created_at, processed_at, order_items(product_name, size, color, quantity, unit_price)"
    )
    .eq("id", orderId)
    .eq("shop_id", shopId)
    .single();

  if (!order) {
    notFound();
  }

  const updateTrackingForOrder = updateTrackingNumber.bind(null, order.id);
  const markProcessedForOrder = markOrderProcessed.bind(null, order.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gray-500 underline">
        ← Toutes les commandes
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold">
          Commande {formatOrderNumber(order.order_number, order.created_at)} —{" "}
          {order.buyer_firstname} {order.buyer_name}
        </h1>
        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
            order.status === "processed"
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded border p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-600">Coordonnées</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd>{order.buyer_email}</dd>
            <dt className="text-gray-500">Téléphone</dt>
            <dd>{order.buyer_phone}</dd>
            <dt className="text-gray-500">Adresse</dt>
            <dd>
              {order.buyer_address}, {order.buyer_zip} {order.buyer_city}
            </dd>
            <dt className="text-gray-500">Commande passée le</dt>
            <dd>
              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </dd>
            {order.processed_at && (
              <>
                <dt className="text-gray-500">Traitée le</dt>
                <dd>
                  {new Date(order.processed_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </dd>
              </>
            )}
          </dl>
        </section>

        <section className="rounded border p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-600">Produits</h2>
          <ul className="flex flex-col gap-2 border-b pb-3">
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
          <div className="flex justify-between pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{order.total_price.toFixed(2)} €</span>
          </div>
        </section>

        <section className="rounded border p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-600">Numéro de suivi</h2>
          <form action={updateTrackingForOrder} className="flex gap-2">
            <input
              name="tracking_number"
              defaultValue={order.tracking_number ?? ""}
              placeholder="Ex: 1Z999AA10123456784"
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
              Enregistrer
            </button>
          </form>
        </section>

        {order.status !== "processed" && (
          <form action={markProcessedForOrder}>
            <button type="submit" className="w-full rounded bg-green-600 px-4 py-2 text-sm text-white">
              Marquer comme traitée
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
