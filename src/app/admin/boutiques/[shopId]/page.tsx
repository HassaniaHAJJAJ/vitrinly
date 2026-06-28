import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe } from "@/lib/stripe";
import { Field, ColorField } from "../ShopFormFields";
import { CopyShopUrl } from "./CopyShopUrl";
import { updateShop, resetSellerPassword, changeSellerEmail } from "./actions";
import { connectStripe } from "./stripe-actions";
import { OpenStripeDashboardButton } from "./OpenStripeDashboardButton";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Merci de remplir le nom et le slug.",
  slug_taken: "Ce slug est déjà utilisé par une autre boutique.",
  shop: "Erreur lors de la mise à jour de la boutique.",
  logo_upload: "Erreur lors de l'envoi du logo.",
  password_too_short: "Le mot de passe doit contenir au moins 6 caractères.",
  no_seller_account: "Aucun compte cliente n'est rattaché à cette boutique.",
  password_reset_failed: "Erreur lors de la réinitialisation du mot de passe.",
  email_required: "Merci de renseigner un email.",
  email_taken: "Cet email est déjà utilisé par un autre compte.",
  email_change_failed: "Erreur lors du changement d'email.",
};

export default async function EditShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{
    error?: string;
    stripe_return?: string;
    password_reset?: string;
    email_changed?: string;
  }>;
}) {
  const { shopId } = await params;
  const { error, stripe_return, password_reset, email_changed } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id, name, slug, logo_url, primary_color, title_color, text_color, background_color, paypal_email, whatsapp_number, mondial_relay_price, chronopost_price, stripe_account_id, stripe_onboarding_complete"
    )
    .eq("id", shopId)
    .single();

  if (!shop) {
    notFound();
  }

  const admin = createAdminClient();

  // After returning from Stripe-hosted onboarding, refresh the connected
  // account's status so the "connected" badge reflects reality immediately.
  if (stripe_return && shop.stripe_account_id && !shop.stripe_onboarding_complete) {
    const account = await getStripe().accounts.retrieve(shop.stripe_account_id);
    if (account.charges_enabled) {
      await admin.from("shops").update({ stripe_onboarding_complete: true }).eq("id", shopId);
      shop.stripe_onboarding_complete = true;
    }
  }

  const { data: sellerProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("shop_id", shopId)
    .eq("role", "seller")
    .single();

  const sellerEmail = sellerProfile
    ? (await admin.auth.admin.getUserById(sellerProfile.id)).data.user?.email
    : null;

  const updateShopForItem = updateShop.bind(null, shop.id);
  const connectStripeForItem = connectStripe.bind(null, shop.id);
  const resetSellerPasswordForItem = resetSellerPassword.bind(null, shop.id);
  const changeSellerEmailForItem = changeSellerEmail.bind(null, shop.id);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <BackLink href="/admin">Toutes les boutiques</BackLink>

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

      {password_reset && (
        <p className="mb-6 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Mot de passe mis à jour. Communique-le à la cliente.
        </p>
      )}

      {email_changed && (
        <p className="mb-6 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Email de connexion mis à jour. Communique-le à la cliente.
        </p>
      )}

      <fieldset className="mb-6 flex flex-col gap-3 rounded border p-4">
        <legend className="px-1 text-sm font-medium text-gray-600">
          Compte de connexion cliente
        </legend>

        <form action={changeSellerEmailForItem} className="flex gap-2">
          <input
            name="new_email"
            type="email"
            required
            defaultValue={sellerEmail ?? ""}
            placeholder="Email de connexion"
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
            Modifier
          </button>
        </form>

        <form action={resetSellerPasswordForItem} className="flex gap-2">
          <input
            name="new_password"
            type="text"
            required
            minLength={6}
            placeholder="Nouveau mot de passe"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-black px-4 py-2 text-sm text-white">
            Réinitialiser
          </button>
        </form>
        <p className="text-xs text-gray-500">
          Définit un nouveau mot de passe pour le compte que la cliente utilise sur
          vitrineasy.fr/dashboard/login. Pense à le lui communiquer.
        </p>
      </fieldset>

      <fieldset className="mb-6 flex flex-col gap-3 rounded border p-4">
        <legend className="px-1 text-sm font-medium text-gray-600">Paiement en ligne (Stripe)</legend>

        {!shop.stripe_account_id && (
          <form action={connectStripeForItem}>
            <button type="submit" className="rounded bg-[#635bff] px-4 py-2 text-sm text-white">
              Connecter Stripe
            </button>
          </form>
        )}

        {shop.stripe_account_id && !shop.stripe_onboarding_complete && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-amber-700">Configuration Stripe non terminée.</p>
            <form action={connectStripeForItem}>
              <button type="submit" className="rounded bg-[#635bff] px-4 py-2 text-sm text-white">
                Continuer la configuration
              </button>
            </form>
          </div>
        )}

        {shop.stripe_account_id && shop.stripe_onboarding_complete && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-700">Stripe connecté ✓</p>
            <OpenStripeDashboardButton shopId={shop.id} />
          </div>
        )}

        <p className="rounded bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Stripe prélève environ <strong>1,5 % + 0,25 €</strong> par vente (cartes européennes),
          généralement moins cher que PayPal. Exemple : pour une commande de 50 €, la cliente
          reçoit environ <strong>49 €</strong> (50 € − 1 € de frais). L&apos;argent est ensuite
          versé automatiquement sur son compte bancaire.
        </p>
      </fieldset>

      <form action={updateShopForItem} className="flex flex-col gap-5">
        <Field label="Nom de la boutique" name="name" required defaultValue={shop.name} />
        <Field
          label="Slug (URL)"
          name="slug"
          required
          defaultValue={shop.slug}
          hint="Boutique visible sur vitrineasy.fr/boutique/leila-mode"
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
          label="Numéro WhatsApp"
          name="whatsapp_number"
          placeholder="+33612345678"
          defaultValue={shop.whatsapp_number ?? ""}
        />

        <fieldset className="flex flex-col gap-3 rounded border p-4">
          <legend className="px-1 text-sm font-medium text-gray-600">Paiement par PayPal</legend>
          <Field
            label="Email PayPal de la cliente"
            name="paypal_email"
            type="email"
            defaultValue={shop.paypal_email ?? ""}
            hint="Compte PayPal Business obligatoire (gratuit à créer, pas d'abonnement) ; PayPal refuse de recevoir des paiements de tiers sur un compte Personal."
          />
          <p className="rounded bg-blue-50 px-3 py-2 text-xs text-blue-900">
            PayPal prélève environ <strong>2,9 % + 0,35 €</strong> par vente. Exemple : pour une
            commande de 50 €, la cliente reçoit environ <strong>48,20 €</strong> (50 € − 1,80 € de frais).
          </p>
        </fieldset>

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
