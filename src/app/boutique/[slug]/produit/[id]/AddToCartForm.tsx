"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { addToCart, getCart } from "@/lib/cart";

type Variant = { id: string; size: string; color: string; stock: number };
type ProductImage = { url: string; position: number };

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return null;
  if (stock === 1)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        Dernière pièce
      </span>
    );
  if (stock <= 5)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        Plus que {stock} en stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      <span className="h-2 w-2 rounded-full bg-green-500" />
      En stock
    </span>
  );
}

export function AddToCartForm({
  shopSlug,
  productId,
  name,
  price,
  images,
  variants,
  accentColor,
  titleColor,
  description,
}: {
  shopSlug: string;
  productId: string;
  name: string;
  price: number;
  images: ProductImage[];
  variants: Variant[];
  accentColor: string;
  titleColor: string;
  description: string | null;
}) {
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size).filter(Boolean))], [variants]);
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))], [variants]);

  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [cartQty, setCartQty] = useState(0);
  const [overStock, setOverStock] = useState(false);

  const selectedVariant = variants.find((v) => v.size === size && v.color === color);
  const outOfStock = !selectedVariant || selectedVariant.stock <= 0;

  // Sync quantité panier pour la variante sélectionnée
  const selectedVariantId = selectedVariant?.id;
  useEffect(() => {
    const sync = () => {
      if (!selectedVariantId) return setCartQty(0);
      const cart = getCart(shopSlug);
      const item = cart.find((i) => i.variantId === selectedVariantId);
      setCartQty(item?.quantity ?? 0);
    };
    sync();
    window.addEventListener("vitrineasy-cart-updated", sync);
    return () => window.removeEventListener("vitrineasy-cart-updated", sync);
  }, [selectedVariantId, shopSlug]);

  function handleColorChange(c: string) {
    setColor(c);
    setAdded(false);
    setOverStock(false);
    // Sync image avec la couleur directement dans le handler, sans useEffect
    const colorIndex = colors.indexOf(c);
    if (colorIndex >= 0 && colorIndex < images.length) {
      setActiveIndex(colorIndex);
    }
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    if (selectedVariant.stock !== null && cartQty + 1 > selectedVariant.stock) {
      setOverStock(true);
      return;
    }
    setOverStock(false);
    addToCart(shopSlug, {
      productId,
      variantId: selectedVariant.id,
      name,
      price,
      size,
      color,
      image: images[0]?.url ?? null,
      quantity: 1,
    });
    setAdded(true);
  }

  function selectThumbnail(index: number) {
    setActiveIndex(index);
    if (index < colors.length) {
      setColor(colors[index]);
      setAdded(false);
      setOverStock(false);
    }
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Galerie */}
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-black/5">
          {activeImage && (
            <Image
              src={activeImage.url}
              alt={name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => selectThumbnail(i)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                  i === activeIndex ? "border-gray-800 opacity-100" : "border-transparent opacity-60 hover:opacity-90"
                }`}
                style={i === activeIndex ? { borderColor: accentColor } : undefined}
              >
                <Image
                  src={img.url}
                  alt={`${name} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Infos + formulaire */}
      <div className="flex flex-col gap-4">
        <div className="hidden md:flex md:flex-col md:gap-2">
          <h1 className="text-2xl font-bold" style={{ color: titleColor }}>{name}</h1>
          <p className="text-xl font-semibold" style={{ color: accentColor }}>{price} €</p>
        </div>
        {description && (
          <div
            className="text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        <div className="flex flex-col gap-4">
          {sizes.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Taille</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSize(s); setAdded(false); setOverStock(false); }}
                    className="rounded border px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                    style={
                      s === size
                        ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}15` }
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
                    onClick={() => handleColorChange(c)}
                    className="rounded border px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                    style={
                      c === color
                        ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}15` }
                        : undefined
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
              {images.length >= colors.length && colors.length > 1 && (
                <p className="text-xs text-gray-400">Les photos correspondent aux couleurs dans l&apos;ordre.</p>
              )}
            </div>
          )}

          {selectedVariant && !outOfStock && (
            <StockBadge stock={selectedVariant.stock} />
          )}

          {outOfStock ? (
            <p className="text-sm text-red-600">Cette combinaison n&apos;est pas disponible.</p>
          ) : overStock ? (
            <p className="text-sm font-medium text-red-600">
              Quantité maximale atteinte, il ne reste que {selectedVariant?.stock} pièce{selectedVariant?.stock === 1 ? "" : "s"}.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="rounded px-4 py-3 text-base font-medium text-white"
              style={{ backgroundColor: accentColor }}
            >
              {added ? "Ajouté ✓" : "Ajouter au panier"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
