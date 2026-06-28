import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resetPassword } from "../mot-de-passe-oublie/actions";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  mdp_court: "Le mot de passe doit faire au moins 8 caractères.",
  mdp_different: "Les mots de passe ne correspondent pas.",
  lien_invalide: "Ce lien est invalide ou expiré.",
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { token, error } = await searchParams;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from("shops")
    .select("name, slug, primary_color, title_color, text_color, background_color, logo_url")
    .eq("slug", slug)
    .single();

  if (!shop || !token) notFound();

  const action = resetPassword.bind(null, shop.slug, token);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        {shop.logo_url && (
          <img src={shop.logo_url} alt={shop.name} className="h-16 w-16 rounded-full object-cover mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-semibold text-center mb-1" style={{ color: shop.title_color }}>
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-center opacity-60 mb-8">{shop.name}</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
          </p>
        )}

        <form action={action} className="flex flex-col gap-3">
          <input name="password" type="password" placeholder="Nouveau mot de passe" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <input name="confirm" type="password" placeholder="Confirmer le mot de passe" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
          <button type="submit" className="mt-1 rounded py-2.5 text-sm font-medium text-white" style={{ backgroundColor: shop.primary_color }}>
            Enregistrer
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href={`/boutique/${slug}/compte/connexion`} className="opacity-50 underline text-xs">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
