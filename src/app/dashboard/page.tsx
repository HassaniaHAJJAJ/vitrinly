import { requireSeller } from "@/lib/supabase/require-seller";
import { OrdersList } from "./OrdersList";
import { DashboardNav } from "./DashboardNav";

export default async function DashboardPage() {
  const { supabase, shopId } = await requireSeller();

  const { data: shop } = await supabase.from("shops").select("name, slug, logo_url").eq("id", shopId).single();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, buyer_firstname, buyer_name, total_price, status, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <DashboardNav shopName={shop?.name ?? ""} logoUrl={shop?.logo_url} shopSlug={shop?.slug} />

      {!orders || orders.length === 0 ? (
        <p className="text-gray-500">Aucune commande pour le moment.</p>
      ) : (
        <OrdersList orders={orders} />
      )}
    </main>
  );
}
