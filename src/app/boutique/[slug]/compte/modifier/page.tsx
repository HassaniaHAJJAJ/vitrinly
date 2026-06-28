import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBuyerSession } from "@/lib/buyer-auth";
import { updateProfile } from "./actions";
import Link from "next/link";

export default async function ModifierPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("name, slug, primary_color, title_color, text_color, background_color, logo_url")
    .eq("slug", slug)
    .single();

  if (!shop) notFound();

  const account = await getBuyerSession(slug);
  if (!account) redirect(`/boutique/${slug}/compte/connexion`);

  const action = updateProfile.bind(null, shop.slug);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        <h1 className="text-2xl font-semibold text-center mb-8" style={{ color: shop.title_color }}>
          Mes coordonnées
        </h1>

        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="firstname" defaultValue={account.firstname} placeholder="Prénom" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
            <input name="lastname" defaultValue={account.lastname} placeholder="Nom" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          </div>
          <input name="phone" type="tel" defaultValue={account.phone ?? ""} placeholder="Téléphone" className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <input name="address" defaultValue={account.address ?? ""} placeholder="Adresse" className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <div className="grid grid-cols-2 gap-3">
            <input name="zip" defaultValue={account.zip ?? ""} placeholder="Code postal" className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
            <input name="city" defaultValue={account.city ?? ""} placeholder="Ville" className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          </div>
          <button
            type="submit"
            className="mt-1 rounded py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: shop.primary_color }}
          >
            Enregistrer
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href={`/boutique/${slug}/compte`} className="text-xs opacity-50 underline">
            ← Retour au compte
          </Link>
        </p>
      </div>
    </div>
  );
}
