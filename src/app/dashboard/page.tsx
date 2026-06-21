import { requireSeller } from "@/lib/supabase/require-seller";
import { logoutSeller } from "./login/actions";
import { OrdersList } from "./OrdersList";

export default async function DashboardPage() {
  const { supabase, shopId } = await requireSeller();

  const { data: shop } = await supabase.from("shops").select("name").eq("id", shopId).single();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, buyer_firstname, buyer_name, total_price, status, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold">Commandes — {shop?.name}</h1>
        <form action={logoutSeller}>
          <button type="submit" className="text-sm text-gray-500 underline">
            Déconnexion
          </button>
        </form>
      </div>

      {!orders || orders.length === 0 ? (
        <p className="text-gray-500">Aucune commande pour le moment.</p>
      ) : (
        <OrdersList orders={orders} />
      )}
    </main>
  );
}
