import Image from "next/image";
import { requireSeller } from "@/lib/supabase/require-seller";
import { DashboardNav } from "../DashboardNav";
import { ColorField, Field } from "@/app/admin/boutiques/ShopFormFields";
import { updateShop } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  logo_upload: "Erreur lors de l'envoi du logo.",
  shop: "Erreur lors de la mise à jour.",
};

export default async function SellerShopPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { supabase, shopId } = await requireSeller();
  const { error, saved } = await searchParams;

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "name, slug, logo_url, primary_color, title_color, text_color, background_color, paypal_email, whatsapp_number, mondial_relay_price, chronopost_price"
    )
    .eq("id", shopId)
    .single();

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <DashboardNav shopName={shop?.name ?? ""} logoUrl={shop?.logo_url} shopSlug={shop?.slug} />

      {error && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
        </p>
      )}

      {saved && (
        <p className="mb-6 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Modifications enregistrées.
        </p>
      )}

      <form action={updateShop} encType="multipart/form-data" className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          {shop?.logo_url && (
            <Image
              src={shop.logo_url}
              alt={shop.name ?? ""}
              width={96}
              height={96}
              className="h-24 w-24 flex-shrink-0 rounded-full object-cover"
            />
          )}
          <label
            htmlFor="logo"
            className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            {shop?.logo_url ? "Modifier le logo" : "Ajouter un logo"}
          </label>
          <input id="logo" name="logo" type="file" accept="image/*" className="hidden" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Couleurs</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorField label="Boutons" name="primary_color" defaultValue={shop?.primary_color ?? "#000000"} />
            <ColorField label="Titres" name="title_color" defaultValue={shop?.title_color ?? "#000000"} />
            <ColorField label="Texte" name="text_color" defaultValue={shop?.text_color ?? "#1f1f1f"} />
            <ColorField label="Fond" name="background_color" defaultValue={shop?.background_color ?? "#ffffff"} />
          </div>
        </div>

        <Field
          label="Numéro WhatsApp"
          name="whatsapp_number"
          placeholder="+33612345678"
          defaultValue={shop?.whatsapp_number ?? ""}
        />

        <Field
          label="Email PayPal"
          name="paypal_email"
          type="email"
          defaultValue={shop?.paypal_email ?? ""}
          hint="Doit être un compte PayPal Business pour recevoir des paiements."
        />

        <fieldset className="flex flex-col gap-4 rounded border p-4">
          <legend className="px-1 text-sm font-semibold text-gray-700">Frais de livraison</legend>
          <p className="text-xs text-gray-500">
            Laisse vide pour ne pas proposer ce mode de livraison.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Mondial Relay (€)"
              name="mondial_relay_price"
              type="number"
              placeholder="4.90"
              defaultValue={shop?.mondial_relay_price?.toString() ?? ""}
            />
            <Field
              label="Chronopost (€)"
              name="chronopost_price"
              type="number"
              placeholder="7.90"
              defaultValue={shop?.chronopost_price?.toString() ?? ""}
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
