import { BackLink } from "@/components/BackLink";
import { notFound } from "next/navigation";
import { requireSeller } from "@/lib/supabase/require-seller";
import { updateTrackingNumber, markOrderProcessed, cancelReviewRequests } from "./actions";
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
      "id, order_number, buyer_firstname, buyer_name, buyer_email, buyer_phone, buyer_address, buyer_zip, buyer_city, total_price, shipping_method, shipping_price, status, tracking_number, created_at, processed_at, review_requests_sent, review_requested_at, review_requests_cancelled, order_items(product_name, size, color, quantity, unit_price, product_id, products(product_images(url, position)))"
    )
    .eq("id", orderId)
    .eq("shop_id", shopId)
    .single();

  if (!order) {
    notFound();
  }

  const updateTrackingForOrder = updateTrackingNumber.bind(null, order.id);
  const markProcessedForOrder = markOrderProcessed.bind(null, order.id);
  const cancelReviewsForOrder = cancelReviewRequests.bind(null, order.id);

  // Calcul des dates prévues pour les demandes d'avis
  const orderDate = new Date(order.created_at);
  const firstRequestDate = new Date(orderDate);
  firstRequestDate.setDate(firstRequestDate.getDate() + 5);
  const secondRequestDate = order.review_requested_at
    ? new Date(new Date(order.review_requested_at).getTime() + 15 * 24 * 60 * 60 * 1000)
    : new Date(orderDate.getTime() + 20 * 24 * 60 * 60 * 1000);

  function formatDate(d: Date) {
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <BackLink href="/dashboard">Toutes les commandes</BackLink>

      <div className="mb-6 mt-2 flex items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold">
          Commande {formatOrderNumber(order.order_number, order.created_at)},{" "}
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
            {order.order_items.map((item, i) => {
              const product = Array.isArray((item as any).products) ? (item as any).products[0] : (item as any).products;
              const images = [...(product?.product_images ?? [])].sort((a: any, b: any) => a.position - b.position);
              const thumb = images[0]?.url;
              return (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {thumb && (
                    <img src={thumb} alt={item.product_name} className="h-12 w-12 rounded object-cover flex-shrink-0" />
                  )}
                  <span className="flex-1">
                    {item.product_name} ({item.size} / {item.color}) × {item.quantity}
                  </span>
                  <span className="font-medium">{(item.unit_price * item.quantity).toFixed(2)} €</span>
                </li>
              );
            })}
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
          <form action={updateTrackingForOrder} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                name="tracking_number"
                defaultValue={order.tracking_number ?? ""}
                placeholder="Ex: 1Z999AA10123456784"
                className="flex-1 rounded border px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
                Enregistrer
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="notify_buyer" defaultChecked className="h-4 w-4 rounded" />
              Notifier la cliente par email
            </label>
          </form>
        </section>

        {/* Bloc demandes d'avis */}
        <section className="rounded border p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-600">Demandes d'avis</h2>
          {order.review_requests_cancelled ? (
            <p className="text-sm text-gray-400 italic">Demandes d'avis annulées.</p>
          ) : order.review_requests_sent === 2 ? (
            <p className="text-sm text-gray-500">Les 2 demandes ont été envoyées.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {order.review_requests_sent >= 1 ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-gray-300">○</span>
                )}
                <span className={order.review_requests_sent >= 1 ? "text-gray-500 line-through" : ""}>
                  1ère demande — {order.review_requests_sent >= 1 ? "envoyée" : `prévue le ${formatDate(firstRequestDate)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {order.review_requests_sent >= 2 ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-gray-300">○</span>
                )}
                <span className={order.review_requests_sent >= 2 ? "text-gray-500 line-through" : ""}>
                  Rappel — {order.review_requests_sent >= 2 ? "envoyé" : `prévu le ${formatDate(secondRequestDate)}`}
                </span>
              </div>
              <form action={cancelReviewsForOrder} className="mt-3">
                <button
                  type="submit"
                  className="text-xs text-red-400 underline underline-offset-2 hover:text-red-600"
                >
                  Annuler les demandes d'avis
                </button>
              </form>
            </div>
          )}
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
