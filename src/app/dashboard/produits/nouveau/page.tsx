import { BackLink } from "@/components/BackLink";
import { requireSeller } from "@/lib/supabase/require-seller";
import { VariantsEditor } from "@/app/admin/boutiques/[shopId]/produits/VariantsEditor";
import { DescriptionField } from "@/app/admin/boutiques/[shopId]/produits/DescriptionField";
import { PhotosField } from "@/components/PhotosField";
import { createProduct } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Merci de remplir le nom et un prix valide.",
  product: "Erreur lors de la création du produit.",
};

export default async function NewProductSellerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSeller();
  const { error } = await searchParams;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <BackLink href="/dashboard/produits">Mes produits</BackLink>

      <h1 className="mb-6 mt-2 text-2xl font-semibold">Nouveau produit</h1>

      {error && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
        </p>
      )}

      <form action={createProduct} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-base font-semibold">
            Nom du produit *
          </label>
          <input id="name" name="name" required className="rounded border px-3 py-2" />
        </div>

        <DescriptionField />

        <div className="flex flex-col gap-1">
          <label htmlFor="price" className="text-base font-semibold">
            Prix (€) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            className="w-32 rounded border px-3 py-2"
          />
        </div>


        <PhotosField />

        <VariantsEditor />

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Créer le produit
        </button>
      </form>
    </main>
  );
}
