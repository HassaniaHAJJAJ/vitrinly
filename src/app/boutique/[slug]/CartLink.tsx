"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cartCount, getCart } from "@/lib/cart";

export function CartLink({ shopSlug, accentColor }: { shopSlug: string; accentColor: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setCount(cartCount(getCart(shopSlug)));
    }

    refresh();
    window.addEventListener("vitrinly-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("vitrinly-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [shopSlug]);

  return (
    <Link
      href={`/boutique/${shopSlug}/panier`}
      className="fixed right-4 top-4 z-10 rounded-full px-4 py-2 text-sm font-medium text-white shadow"
      style={{ backgroundColor: accentColor }}
    >
      Panier{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
