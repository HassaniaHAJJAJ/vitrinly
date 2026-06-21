import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { VariantsEditor } from "../VariantsEditor";
import { DescriptionField } from "../DescriptionField";
import { updateProduct, deleteProduct } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Merci de remplir le nom et un prix valide.",
  product: "Erreur lors de la mise à jour du produit.",
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string; productId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { shopId, productId } = await params;
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price, product_images(id, url, position), variants(id, size, color, stock)"
    )
    .eq("id", productId)
    .eq("shop_id", shopId)
    .single();

  if (!product) {
    notFound();
  }

  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  const variantRows = (product.variants ?? []).map((v) => ({
    key: v.id,
    size: v.size,
    color: v.color,
    stock: v.stock,
  }));

  const updateProductForItem = updateProduct.bind(null, shopId, productId);
  const deleteProductForItem = deleteProduct.bind(null, shopId, productId);

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <Link href={`/admin/boutiques/${shopId}/produits`} className="text-sm text-gray-500 underline">
        ← Retour aux produits
      </Link>

      <h1 className="mb-6 mt-2 text-2xl font-semibold">Modifier le produit</h1>

      {error && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {ERROR_MESSAGES[error] ?? "Une erreur est survenue."}
        </p>
      )}

      <form
        action={updateProductForItem}
        encType="multipart/form-data"
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-base font-semibold">
            Nom du produit *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product.name}
            className="rounded border px-3 py-2"
          />
        </div>

        <DescriptionField defaultValue={product.description ?? ""} />

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
            defaultValue={product.price}
            className="w-32 rounded border px-3 py-2"
          />
        </div>

        {images.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-base font-semibold">Photos actuelles</p>
            <div className="flex flex-wrap gap-3">
              {images.map((image) => (
                <label key={image.id} className="flex flex-col items-center gap-1 text-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="h-20 w-20 rounded border object-cover"
                  />
                  <span className="flex items-center gap-1">
                    <input type="checkbox" name="delete_images[]" value={image.id} />
                    Supprimer
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="photos" className="text-base font-semibold">
            Ajouter des photos
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

        <VariantsEditor initial={variantRows} />

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Enregistrer
        </button>
      </form>

      <form action={deleteProductForItem} className="mt-4">
        <button type="submit" className="text-sm text-red-600 underline">
          Supprimer ce produit
        </button>
      </form>
    </main>
  );
}
