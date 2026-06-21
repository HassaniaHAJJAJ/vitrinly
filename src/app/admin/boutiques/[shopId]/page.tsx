import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { Field, ColorField } from "../ShopFormFields";
import { CopyShopUrl } from "./CopyShopUrl";
import { updateShop } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Merci de remplir le nom et le slug.",
  slug_taken: "Ce slug est déjà utilisé par une autre boutique.",
  shop: "Erreur lors de la mise à jour de la boutique.",
  logo_upload: "Erreur lors de l'envoi du logo.",
};

export default async function EditShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { shopId } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, slug, logo_url, primary_color, title_color, text_color, background_color, paypal_email, whatsapp_number, mondial_relay_price, chronopost_price"
    )
    .eq("id", shopId)
    .single();

  if (!shop) {
    notFound();
  }

  const updateShopForItem = updateShop.bind(null, shop.id);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Link href="/admin" className="text-sm text-gray-500 underline">
        ← Toutes les boutiques
      </Link>

      <div className="mb-6 mt-2 flex items-center justify-between gap-6">
        <h1 className="text-2xl font-semibold">Modifier {shop.name}</h1>
        <Link
          href={`/admin/boutiques/${shop.id}/produits`}
          className="whitespace-nowrap rounded bg-black px-3 py-1.5 text-sm text-white"
        >
          Gérer les produits →
        </Link>
      </div>

      <div className="mb-6">
        <CopyShopUrl
          url={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/boutique/${shop.slug}`}
        />
      </div>

      {error && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
        </p>
      )}

      <form action={updateShopForItem} encType="multipart/form-data" className="flex flex-col gap-5">
        <Field label="Nom de la boutique" name="name" required defaultValue={shop.name} />
        <Field
          label="Slug (URL)"
          name="slug"
          required
          defaultValue={shop.slug}
          hint="Boutique visible sur vitrinly.fr/boutique/leila-mode"
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ColorField label="Boutons / accents" name="primary_color" defaultValue={shop.primary_color} />
          <ColorField label="Titres" name="title_color" defaultValue={shop.title_color} />
          <ColorField label="Texte" name="text_color" defaultValue={shop.text_color} />
          <ColorField label="Fond" name="background_color" defaultValue={shop.background_color} />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="logo" className="text-sm font-medium">
            Logo
          </label>
          {shop.logo_url && (
            <Image
              src={shop.logo_url}
              alt={shop.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <input id="logo" name="logo" type="file" accept="image/*" />
        </div>

        <Field
          label="Email PayPal de la cliente"
          name="paypal_email"
          type="email"
          defaultValue={shop.paypal_email ?? ""}
        />
        <Field
          label="Numéro WhatsApp"
          name="whatsapp_number"
          placeholder="+33612345678"
          defaultValue={shop.whatsapp_number ?? ""}
        />

        <fieldset className="flex flex-col gap-4 rounded border p-4">
          <legend className="px-1 text-sm font-medium text-gray-600">Frais de livraison</legend>
          <p className="text-xs text-gray-500">
            Laisse vide pour ne pas proposer ce mode de livraison aux acheteuses.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Mondial Relay (€)"
              name="mondial_relay_price"
              type="number"
              placeholder="4.90"
              defaultValue={shop.mondial_relay_price?.toString() ?? ""}
            />
            <Field
              label="Chronopost (€)"
              name="chronopost_price"
              type="number"
              placeholder="7.90"
              defaultValue={shop.chronopost_price?.toString() ?? ""}
            />
          </div>
        </fieldset>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Enregistrer
        </button>
      </form>
    </main>
  );
}
