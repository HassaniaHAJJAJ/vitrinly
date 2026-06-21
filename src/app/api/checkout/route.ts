import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createPaypalOrder } from "@/lib/paypal";
import { resolveShippingPrice } from "@/lib/shipping";

export async function POST(request: Request) {
  const { shopSlug, items, shippingMethod } = await request.json();

  if (!shopSlug || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, paypal_email, mondial_relay_price, chronopost_price")
    .eq("slug", shopSlug)
    .single();

  if (!shop || !shop.paypal_email) {
    return NextResponse.json({ error: "shop_not_payable" }, { status: 400 });
  }

  let shippingPrice: number;
  try {
    shippingPrice = resolveShippingPrice(shop, shippingMethod);
  } catch {
    return NextResponse.json({ error: "invalid_shipping_method" }, { status: 400 });
  }

  const variantIds = items.map((item: { variantId: string }) => item.variantId);
  const { data: variants } = await admin
    .from("variants")
    .select("id, stock, products(id, price, shop_id)")
    .in("id", variantIds);

  if (!variants || variants.length !== variantIds.length) {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  let total = 0;
  for (const item of items as { variantId: string; quantity: number }[]) {
    const variant = variants.find((v) => v.id === item.variantId);
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;

    if (!variant || !product || product.shop_id !== shop.id || item.quantity < 1) {
      return NextResponse.json({ error: "invalid_items" }, { status: 400 });
    }

    total += product.price * item.quantity;
  }

  total += shippingPrice;

  try {
    const paypalOrder = await createPaypalOrder(shop.paypal_email, total);
    return NextResponse.json({ id: paypalOrder.id });
  } catch {
    return NextResponse.json({ error: "paypal_error" }, { status: 500 });
  }
}
