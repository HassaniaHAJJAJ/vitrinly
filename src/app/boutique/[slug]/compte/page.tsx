import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getBuyerSession } from "@/lib/buyer-auth";
import { formatOrderNumber } from "@/lib/order-number";
import Link from "next/link";

export default async function ComptePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, primary_color, title_color, text_color, background_color, logo_url")
    .eq("slug", slug)
    .single();

  if (!shop) notFound();

  const account = await getBuyerSession(slug);
  if (!account) redirect(`/boutique/${slug}/compte/connexion`);

  const admin = createAdminClient();

  const [{ data: orders }, { data: pointsRow }] = await Promise.all([
    admin
      .from("orders")
      .select("id, order_number, created_at, total_price, status")
      .eq("shop_id", shop.id)
      .eq("buyer_email", account.email)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("loyalty_points")
      .select("points")
      .eq("buyer_account_id", account.id)
      .eq("shop_id", shop.id)
      .maybeSingle(),
  ]);

  const points = pointsRow?.points ?? 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <div className="mx-auto max-w-xl px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: shop.title_color }}>
              Bonjour {account.firstname} 👋
            </h1>
            <p className="text-sm opacity-50 mt-0.5">{account.email}</p>
          </div>
          <form method="POST" action={`/boutique/${slug}/compte/deconnexion`}>
            <button type="submit" className="text-sm opacity-40 underline">Déconnexion</button>
          </form>
        </div>

        {/* Points */}
        <section className="mb-8 rounded-xl p-5" style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⭐</span>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#b45309" }}>Mes points fidélité</p>
          </div>
          <p className="text-3xl font-bold mb-4" style={{ color: "#92400e" }}>
            {points} <span className="text-sm font-normal" style={{ color: "#b45309" }}>points</span>
          </p>
          <div className="space-y-1.5 text-sm" style={{ color: "#b45309" }}>
            <p><span className="font-bold">5 points</span> par achat</p>
            <p><span className="font-bold">3 points</span> par avis approuvé</p>
          </div>
        </section>

        {/* Profil */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Mes coordonnées</h2>
          </div>
          <div className="rounded-lg border p-4 text-sm space-y-1 opacity-80" style={{ borderColor: `${shop.primary_color}30` }}>
            <p>{account.firstname} {account.lastname}</p>
            {account.phone && <p>{account.phone}</p>}
            {account.address && <p>{account.address}, {account.zip} {account.city}</p>}
          </div>
          <Link
            href={`/boutique/${slug}/compte/modifier`}
            className="mt-2 inline-block text-xs underline opacity-50"
          >
            Modifier mes coordonnées
          </Link>
        </section>

        {/* Commandes */}
        <section>
          <h2 className="text-base font-semibold mb-4">Mes commandes</h2>
          {!orders || orders.length === 0 ? (
            <p className="text-sm opacity-50">Aucune commande pour l'instant.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border p-4 flex items-center justify-between gap-3"
                  style={{ borderColor: `${shop.primary_color}20` }}
                >
                  <div>
                    <p className="text-sm font-medium">
                      Commande {formatOrderNumber(order.order_number, order.created_at)}
                    </p>
                    <p className="text-xs opacity-50 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")} · {order.total_price.toFixed(2)} €
                    </p>
                  </div>
                  <span
                    className="text-xs rounded-full px-2 py-0.5 whitespace-nowrap"
                    style={order.status === "processed"
                      ? { backgroundColor: "#dcfce7", color: "#166534" }
                      : { backgroundColor: "#fef9c3", color: "#854d0e" }}
                  >
                    {order.status === "processed" ? "Traitée" : "En cours"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 text-center">
          <Link href={`/boutique/${slug}`} className="text-sm opacity-40 underline">
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    </div>
  );
}
