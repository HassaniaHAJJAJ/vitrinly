"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";

type Variant = { id: string; size: string; color: string; stock: number };

export function AddToCartForm({
  shopSlug,
  productId,
  name,
  price,
  image,
  variants,
  accentColor,
}: {
  shopSlug: string;
  productId: string;
  name: string;
  price: number;
  image: string | null;
  variants: Variant[];
  accentColor: string;
}) {
  const router = useRouter();
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants]);

  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.size === size && v.color === color);
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  function handleAddToCart() {
    if (!selectedVariant) return;

    addToCart(shopSlug, {
      productId,
      variantId: selectedVariant.id,
      name,
      price,
      size,
      color,
      image,
      quantity: 1,
    });

    setAdded(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {sizes.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Taille</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setAdded(false);
                }}
                className="rounded border px-3 py-1.5 text-sm"
                style={
                  s === size
                    ? { borderColor: accentColor, color: accentColor }
                    : undefined
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Couleur</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setAdded(false);
                }}
                className="rounded border px-3 py-1.5 text-sm"
                style={
                  c === color
                    ? { borderColor: accentColor, color: accentColor }
                    : undefined
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {outOfStock ? (
        <p className="text-sm text-red-600">Cette combinaison n&apos;est pas disponible.</p>
      ) : (
        <button
          type="button"
          onClick={handleAddToCart}
          className="rounded px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: accentColor }}
        >
          {added ? "Ajouté ✓" : "Ajouter au panier"}
        </button>
      )}
    </div>
  );
}
