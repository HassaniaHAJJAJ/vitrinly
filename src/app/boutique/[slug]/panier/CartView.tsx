"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  type CartItem,
  cartTotal,
  getCart,
  removeFromCart,
  updateQuantity,
} from "@/lib/cart";

export function CartView({
  shopSlug,
  accentColor,
}: {
  shopSlug: string;
  accentColor: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function refresh() {
      setItems(getCart(shopSlug));
    }

    refresh();
    setLoaded(true);

    window.addEventListener("vitrinly-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("vitrinly-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [shopSlug]);

  if (!loaded) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="opacity-70">Ton panier est vide.</p>
        <Link
          href={`/boutique/${shopSlug}`}
          className="rounded px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: accentColor }}
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.variantId} className="flex items-center gap-4 border-b pb-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-black/5">
              {item.image && (
                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-xs opacity-70">
                {item.size} · {item.color}
              </span>
            </div>

            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => {
                updateQuantity(shopSlug, item.variantId, Number(e.target.value) || 1);
              }}
              className="w-16 rounded border px-2 py-1 text-sm"
            />

            <span className="w-16 text-right text-sm font-medium">
              {(item.price * item.quantity).toFixed(2)} €
            </span>

            <button
              type="button"
              onClick={() => removeFromCart(shopSlug, item.variantId)}
              className="text-sm text-red-600 underline"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-semibold" style={{ color: accentColor }}>
          {cartTotal(items).toFixed(2)} €
        </span>
      </div>

      <Link
        href={`/boutique/${shopSlug}/commande`}
        className="rounded px-4 py-3 text-center text-sm font-medium text-white"
        style={{ backgroundColor: accentColor }}
      >
        Passer commande
      </Link>
    </div>
  );
}
