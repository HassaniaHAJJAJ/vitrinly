import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { VariantsEditor } from "../VariantsEditor";
import { DescriptionField } from "../DescriptionField";
import { createProduct } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Merci de remplir le nom et un prix valide.",
  product: "Erreur lors de la création du produit.",
};

export default async function NewProductPage({
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
    .select("id, name")
    .eq("id", shopId)
    .single();

  if (!shop) {
    notFound();
  }

  const createProductForShop = createProduct.bind(null, shopId);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Link href={`/admin/boutiques/${shop.id}/produits`} className="text-sm text-gray-500 underline">
        ← Produits de {shop.name}
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-semibold">Nouveau produit</h1>

      {error && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
        </p>
      )}

      <form action={createProductForShop} encType="multipart/form-data" className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-1">
          <label htmlFor="photos" className="text-base font-semibold">
            Photos
          </label>
          <input
            id="photos"
            name="photos"
            type="file"
            accept="image/*"
            multiple
            className="file:mr-3 file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-sm file:text-gray-700 hover:file:bg-gray-300"
          />
        </div>

        <VariantsEditor />

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Créer le produit
        </button>
      </form>
    </main>
  );
}
