import { requireAdmin } from "@/lib/supabase/require-admin";
import { Field, ColorField } from "../ShopFormFields";
import { createShop } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Merci de remplir tous les champs obligatoires.",
  slug_taken: "Ce slug est déjà utilisé par une autre boutique.",
  shop: "Erreur lors de la création de la boutique.",
  logo_upload: "Erreur lors de l'envoi du logo.",
  seller_account: "Erreur lors de la création du compte cliente (email déjà utilisé ?).",
  seller_profile: "Erreur lors du rattachement du compte cliente à la boutique.",
};

export default async function NewShopPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle boutique</h1>

      {error && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
        </p>
      )}

      <form action={createShop} encType="multipart/form-data" className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-4 rounded border p-4">
          <legend className="px-1 text-sm font-medium text-gray-600">Boutique</legend>

          <Field label="Nom de la boutique" name="name" required />
          <Field
            label="Slug (URL)"
            name="slug"
            required
            placeholder="leila-mode"
            hint="Boutique visible sur vitrinly.fr/boutique/leila-mode"
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorField
              label="Boutons / accents"
              name="primary_color"
              defaultValue="#000000"
            />
            <ColorField label="Titres" name="title_color" defaultValue="#000000" />
            <ColorField label="Texte" name="text_color" defaultValue="#1f1f1f" />
            <ColorField
              label="Fond"
              name="background_color"
              defaultValue="#ffffff"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="logo" className="text-sm font-medium">
              Logo
            </label>
            <input id="logo" name="logo" type="file" accept="image/*" />
          </div>
          <Field label="Email PayPal de la cliente" name="paypal_email" type="email" />
          <Field label="Numéro WhatsApp" name="whatsapp_number" placeholder="+33612345678" />
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded border p-4">
          <legend className="px-1 text-sm font-medium text-gray-600">
            Compte de connexion cliente
          </legend>

          <Field label="Email" name="seller_email" type="email" required />
          <Field
            label="Mot de passe temporaire"
            name="seller_password"
            type="password"
            required
            minLength={6}
          />
        </fieldset>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Créer la boutique
        </button>
      </form>
    </main>
  );
}
