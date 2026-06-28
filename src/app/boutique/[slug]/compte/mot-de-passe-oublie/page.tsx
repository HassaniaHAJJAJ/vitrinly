import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestPasswordReset } from "./actions";
import Link from "next/link";

export default async function ForgotPasswordPage({
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

  const action = requestPasswordReset.bind(null, shop.id, shop.slug, shop.name);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: shop.background_color, color: shop.text_color }}>
      <div className="mx-auto w-full max-w-sm px-4 py-16">
        {shop.logo_url && (
          <img src={shop.logo_url} alt={shop.name} className="h-16 w-16 rounded-full object-cover mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-semibold text-center mb-1" style={{ color: shop.title_color }}>
          Mot de passe oublié
        </h1>
        <p className="text-sm text-center opacity-60 mb-8">
          {sent ? "Si un compte existe avec cet email, tu vas recevoir un lien." : "On t'envoie un lien par email."}
        </p>

        {!sent && (
          <>
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                Email requis.
              </p>
            )}
            <form action={action} className="flex flex-col gap-3">
              <input name="email" type="email" placeholder="Ton email" required className="rounded border px-3 py-2 text-sm bg-white text-gray-900" />
              <button type="submit" className="mt-1 rounded py-2.5 text-sm font-medium text-white" style={{ backgroundColor: shop.primary_color }}>
                Envoyer le lien
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href={`/boutique/${slug}/compte/connexion`} className="opacity-50 underline text-xs">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
