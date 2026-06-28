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
import { getVariantsStock } from "./actions";

type StockMap = Record<string, number | null>;

export function CartView({
  shopSlug,
  accentColor,
}: {
  shopSlug: string;
  accentColor: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [stockMap, setStockMap] = useState<StockMap>({});

  useEffect(() => {
    function refresh() {
      setItems(getCart(shopSlug));
    }
    refresh();
    setLoaded(true);
    window.addEventListener("vitrineasy-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("vitrineasy-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [shopSlug]);

  useEffect(() => {
    if (items.length === 0) return;
    getVariantsStock(items.map((i) => i.variantId)).then((results) => {
      const map: StockMap = {};
      for (const r of results) map[r.id] = r.stock;
      setStockMap(map);
    });
  }, [items]);

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

  const stockErrors = items.filter((item) => {
    const stock = stockMap[item.variantId];
    return stock !== undefined && stock !== null && item.quantity > stock;
  });

  const hasErrors = stockErrors.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const stock = stockMap[item.variantId];
          const overStock = stock !== undefined && stock !== null && item.quantity > stock;
          return (
            <li key={item.variantId} className="flex flex-col gap-2 border-b pb-4">
              <div className="flex items-center gap-4">
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
                  max={stock ?? undefined}
                  value={item.quantity}
                  onChange={(e) => {
                    updateQuantity(shopSlug, item.variantId, Number(e.target.value) || 1);
                  }}
                  className={`w-16 rounded border px-2 py-1 text-sm ${overStock ? "border-red-400" : ""}`}
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
              </div>

              {overStock && (
                <p className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Stock insuffisant — il ne reste que {stock} exemplaire{(stock ?? 0) > 1 ? "s" : ""} disponible{(stock ?? 0) > 1 ? "s" : ""}.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-semibold" style={{ color: accentColor }}>
          {cartTotal(items).toFixed(2)} €
        </span>
      </div>

      {hasErrors ? (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Corrige les quantités ci-dessus avant de passer commande.
        </div>
      ) : (
        <Link
          href={`/boutique/${shopSlug}/commande`}
          className="rounded px-4 py-3 text-center text-sm font-medium text-white"
          style={{ backgroundColor: accentColor }}
        >
          Passer commande
        </Link>
      )}
    </div>
  );
}
