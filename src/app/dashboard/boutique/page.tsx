import Image from "next/image";
import { requireSeller } from "@/lib/supabase/require-seller";
import { DashboardNav } from "../DashboardNav";
import { ColorField, Field } from "@/app/admin/boutiques/ShopFormFields";
import { updateShop } from "./actions";
import { legalMentionsTemplate, cgvTemplate, privacyPolicyTemplate } from "@/lib/legal-templates";
import { BannerUpload } from "./BannerUpload";

const ERROR_MESSAGES: Record<string, string> = {
  logo_upload: "Erreur lors de l'envoi du logo.",
  header_upload: "Erreur lors de l'envoi de la bannière.",
  shop: "Erreur lors de la mise à jour.",
};

export default async function SellerShopPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { supabase, shopId } = await requireSeller();
  const { error, saved } = await searchParams;

  const [{ data: shop }, { count: pendingReviewsCount }] = await Promise.all([
    supabase
      .from("shops")
      .select(
        "name, slug, logo_url, header_image_url, header_color, primary_color, title_color, text_color, background_color, paypal_email, whatsapp_number, mondial_relay_price, chronopost_price, legal_mentions, cgv, privacy_policy"
      )
      .eq("id", shopId)
      .single(),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("shop_id", shopId).eq("status", "pending"),
  ]);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <DashboardNav shopName={shop?.name ?? ""} logoUrl={shop?.logo_url} shopSlug={shop?.slug} pendingReviewsCount={pendingReviewsCount ?? 0} />

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

      <form action={updateShop} className="flex flex-col gap-8">

        {/* Logo */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Logo</h2>
          <div className="flex items-center gap-4">
            {shop?.logo_url && (
              <Image src={shop.logo_url} alt={shop.name ?? ""} width={96} height={96}
                className="h-24 w-24 flex-shrink-0 rounded-full object-cover" />
            )}
            <label htmlFor="logo"
              className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              {shop?.logo_url ? "Modifier le logo" : "Ajouter un logo"}
            </label>
            <input id="logo" name="logo" type="file" accept="image/*" className="hidden" />
          </div>
        </section>

        {/* Bannière */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Bannière d&apos;en-tête</h2>
          <p className="text-xs text-gray-500">
            Choisis une couleur ou une image ; si les deux sont définis, l&apos;image est prioritaire.
            Dimensions recommandées pour l&apos;image : <strong>1200 × 400 px</strong>, formats JPG ou PNG.
          </p>
          {/* Aperçu bannière */}
          <BannerUpload headerImageUrl={shop?.header_image_url} headerColor={shop?.header_color} />

          <ColorField label="Couleur de la bannière" name="header_color" defaultValue={shop?.header_color ?? "#f3f4f6"} />
        </section>

        {/* Couleurs */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Couleurs</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ColorField label="Boutons" name="primary_color" defaultValue={shop?.primary_color ?? "#000000"} />
            <ColorField label="Titres" name="title_color" defaultValue={shop?.title_color ?? "#000000"} />
            <ColorField label="Texte" name="text_color" defaultValue={shop?.text_color ?? "#1f1f1f"} />
            <ColorField label="Fond" name="background_color" defaultValue={shop?.background_color ?? "#ffffff"} />
          </div>
        </section>

        {/* Contact */}
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Contact</h2>
          <Field label="Numéro WhatsApp" name="whatsapp_number" placeholder="+33612345678"
            defaultValue={shop?.whatsapp_number ?? ""} />
          <Field label="Email PayPal" name="paypal_email" type="email"
            defaultValue={shop?.paypal_email ?? ""}
            hint="Doit être un compte PayPal Business pour recevoir des paiements." />
        </section>

        {/* Livraison */}
        <section className="flex flex-col gap-3 rounded border p-4">
          <h2 className="text-base font-semibold">Frais de livraison</h2>
          <p className="text-xs text-gray-500">Laisse vide pour ne pas proposer ce mode.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mondial Relay (€)" name="mondial_relay_price" type="number" placeholder="4.90"
              defaultValue={shop?.mondial_relay_price?.toString() ?? ""} />
            <Field label="Chronopost (€)" name="chronopost_price" type="number" placeholder="7.90"
              defaultValue={shop?.chronopost_price?.toString() ?? ""} />
          </div>
        </section>

        {/* Documents légaux */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Documents légaux</h2>
            <p className="text-xs text-gray-500">
              Ces textes apparaissent en bas de ta boutique. Des modèles sont pré-remplis ; complète les zones entre crochets [ ] avec tes informations.
            </p>
          </div>

          <LegalField
            label="Mentions légales"
            name="legal_mentions"
            defaultValue={shop?.legal_mentions ?? legalMentionsTemplate(shop?.name ?? "votre boutique")}
          />
          <LegalField
            label="Conditions Générales de Vente (CGV)"
            name="cgv"
            defaultValue={shop?.cgv ?? cgvTemplate(shop?.name ?? "votre boutique")}
          />
          <LegalField
            label="Politique de confidentialité"
            name="privacy_policy"
            defaultValue={shop?.privacy_policy ?? privacyPolicyTemplate(shop?.name ?? "votre boutique")}
          />
        </section>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Enregistrer
        </button>
      </form>
    </main>
  );
}

function LegalField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-semibold">{label}</label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={10}
        className="rounded border px-3 py-2 text-sm leading-relaxed"
      />
    </div>
  );
}
