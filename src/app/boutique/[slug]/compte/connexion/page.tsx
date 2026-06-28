import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBuyerSession } from "@/lib/buyer-auth";
import { signInBuyer } from "./actions";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  champs_manquants: "Email et mot de passe requis.",
  identifiants: "Email ou mot de passe incorrect.",
  email_non_verifie: "Confirme ton adresse email avant de te connecter. Vérifie ta boîte mail.",
  lien_invalide: "Ce lien de vérification est invalide ou expiré.",
};

export default async function ConnexionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, primary_color, title_color, text_color, background_color, logo_url")
    .eq("slug", slug)
    .single();

  if (!shop) notFound();

  const session = await getBuyerSession(slug);
  if (session) redirect(`/boutique/${slug}/compte`);

  const action = signInBuyer.bind(null, shop.id, shop.slug);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        {shop.logo_url && (
          <img src={shop.logo_url} alt={shop.name} className="h-16 w-16 rounded-full object-cover mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-semibold text-center mb-1" style={{ color: shop.title_color }}>
          Mon compte
        </h1>
        <p className="text-sm text-center opacity-60 mb-8">{shop.name}</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
          </p>
        )}

        <form action={action} className="flex flex-col gap-3">
          <input name="email" type="email" placeholder="Email" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <input name="password" type="password" placeholder="Mot de passe" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <button type="submit" className="mt-1 rounded py-2.5 text-sm font-medium text-white" style={{ backgroundColor: shop.primary_color }}>
            Se connecter
          </button>
        </form>

        <p className="mt-4 text-center">
          <Link href={`/boutique/${slug}/compte/mot-de-passe-oublie`} className="opacity-50 underline text-xs">
            Mot de passe oublié ?
          </Link>
        </p>
        <p className="mt-6 text-center text-sm opacity-60">
          Pas encore de compte ?{" "}
          <Link href={`/boutique/${slug}/compte/inscription`} className="underline" style={{ color: shop.primary_color }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
