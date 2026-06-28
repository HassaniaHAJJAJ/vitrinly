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
    window.addEventListener("vitrineasy-cart-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("vitrineasy-cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [shopSlug]);

  return (
    <div className="fixed right-4 top-4 z-10 flex items-center gap-2">
      <Link
        href={`/boutique/${shopSlug}/compte`}
        title="Mon compte"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow"
        style={{ backgroundColor: accentColor }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      </Link>
      <Link
        href={`/boutique/${shopSlug}/panier`}
        className="rounded-full px-4 py-2 text-sm font-medium text-white shadow"
        style={{ backgroundColor: accentColor }}
      >
        Panier{count > 0 ? ` (${count})` : ""}
      </Link>
    </div>
  );
}
