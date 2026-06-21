import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { capturePaypalOrder } from "@/lib/paypal";
import { resolveShippingPrice } from "@/lib/shipping";

type CheckoutItem = { productId: string; variantId: string; quantity: number };

type Buyer = {
  firstname: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
};

export async function POST(request: Request) {
  const { shopSlug, paypalOrderId, items, shippingMethod, buyer } = (await request.json()) as {
    shopSlug: string;
    paypalOrderId: string;
    items: CheckoutItem[];
    shippingMethod: string | null;
    buyer: Buyer;
  };

  if (!shopSlug || !paypalOrderId || !Array.isArray(items) || items.length === 0 || !buyer) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, mondial_relay_price, chronopost_price")
    .eq("slug", shopSlug)
    .single();

  if (!shop) {
    return NextResponse.json({ error: "shop_not_found" }, { status: 400 });
  }

  let shippingPrice: number;
  try {
    shippingPrice = resolveShippingPrice(shop, shippingMethod);
  } catch {
    return NextResponse.json({ error: "invalid_shipping_method" }, { status: 400 });
  }

  let capture;
  try {
    capture = await capturePaypalOrder(paypalOrderId);
  } catch {
    return NextResponse.json({ error: "paypal_capture_failed" }, { status: 500 });
  }

  if (capture.status !== "COMPLETED") {
    return NextResponse.json({ error: "payment_not_completed" }, { status: 400 });
  }

  const variantIds = items.map((item) => item.variantId);
  const { data: variants } = await admin
    .from("variants")
    .select("id, size, color, products(id, name, price, shop_id)")
    .in("id", variantIds);

  if (!variants || variants.length !== variantIds.length) {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  let total = 0;
  const orderItemsToInsert = [];

  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;

    if (!variant || !product || product.shop_id !== shop.id || item.quantity < 1) {
      return NextResponse.json({ error: "invalid_items" }, { status: 400 });
    }

    total += product.price * item.quantity;
    orderItemsToInsert.push({
      product_id: product.id,
      variant_id: variant.id,
      quantity: item.quantity,
      unit_price: product.price,
      product_name: product.name,
      size: variant.size,
      color: variant.color,
    });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      shop_id: shop.id,
      buyer_name: buyer.name,
      buyer_firstname: buyer.firstname,
      buyer_email: buyer.email,
      buyer_phone: buyer.phone,
      buyer_address: buyer.address,
      buyer_zip: buyer.zip,
      buyer_city: buyer.city,
      total_price: total + shippingPrice,
      shipping_method: shippingMethod,
      shipping_price: shippingPrice,
      paypal_order_id: paypalOrderId,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "order_creation_failed" }, { status: 500 });
  }

  await admin
    .from("order_items")
    .insert(orderItemsToInsert.map((item) => ({ ...item, order_id: order.id })));

  return NextResponse.json({ orderId: order.id });
}
