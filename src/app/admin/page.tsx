import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { logoutAdmin } from "./login/actions-logout";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, slug, primary_color, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Boutiques</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/boutiques/nouvelle"
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Nouvelle boutique
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" className="text-sm text-gray-500 underline">
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      {!shops || shops.length === 0 ? (
        <p className="text-gray-500">Aucune boutique pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shops.map((shop) => (
            <li key={shop.id}>
              <Link
                href={`/admin/boutiques/${shop.id}/produits`}
                className="flex items-center justify-between rounded border px-4 py-3 hover:bg-gray-50"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: shop.primary_color }}
                  />
                  {shop.name}
                </span>
                <span className="text-sm text-gray-500">/boutique/{shop.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
