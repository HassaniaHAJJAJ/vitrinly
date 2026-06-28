import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBuyerSession } from "@/lib/buyer-auth";
import { signUpBuyer } from "./actions";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  champs_manquants: "Tous les champs sont obligatoires.",
  mdp_court: "Le mot de passe doit faire au moins 8 caractères.",
  email_existe: "Un compte existe déjà avec cet email.",
  serveur: "Une erreur est survenue, réessaie.",
};

export default async function InscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { slug } = await params;
  const { error, sent } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, primary_color, title_color, text_color, background_color, logo_url")
    .eq("slug", slug)
    .single();

  if (!shop) notFound();

  const session = await getBuyerSession(slug);
  if (session) redirect(`/boutique/${slug}/compte`);

  const action = signUpBuyer.bind(null, shop.id, shop.slug, shop.name);

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
        <div className="text-center px-4 max-w-sm">
          {shop.logo_url && <img src={shop.logo_url} alt={shop.name} className="h-16 w-16 rounded-full object-cover mx-auto mb-6" />}
          <p className="text-3xl mb-3">📬</p>
          <h1 className="text-xl font-semibold mb-2" style={{ color: shop.title_color }}>Vérifie ta boîte mail</h1>
          <p className="text-sm opacity-60">Un email de confirmation t'a été envoyé. Clique sur le lien pour activer ton compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        {shop.logo_url && (
          <img src={shop.logo_url} alt={shop.name} className="h-16 w-16 rounded-full object-cover mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-semibold text-center mb-1" style={{ color: shop.title_color }}>
          Créer mon compte
        </h1>
        <p className="text-sm text-center opacity-60 mb-8">{shop.name}</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
          </p>
        )}

        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="firstname" placeholder="Prénom" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
            <input name="lastname" placeholder="Nom" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          </div>
          <input name="email" type="email" placeholder="Email" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <input name="password" type="password" placeholder="Mot de passe (8 caractères min.)" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <button type="submit" className="mt-1 rounded py-2.5 text-sm font-medium text-white" style={{ backgroundColor: shop.primary_color }}>
            Créer mon compte
          </button>
        </form>

        <p className="mt-6 text-center text-sm opacity-60">
          Déjà un compte ?{" "}
          <Link href={`/boutique/${slug}/compte/connexion`} className="underline" style={{ color: shop.primary_color }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
