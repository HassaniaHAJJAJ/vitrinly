"use client";

import { useEffect } from "react";
import { saveCart } from "@/lib/cart";

export function ClearCartOnMount({ shopSlug }: { shopSlug: string }) {
  useEffect(() => {
    saveCart(shopSlug, []);
  }, [shopSlug]);

  return null;
}
