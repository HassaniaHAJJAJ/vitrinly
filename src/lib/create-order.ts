import { createAdminClient } from "@/lib/supabase/admin-client";
import { resolveShippingPrice } from "@/lib/shipping";

export type CheckoutItem = { productId: string; variantId: string; quantity: number };

export type Buyer = {
  firstname: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
};

type PaymentRef =
  | { provider: "paypal"; paypalOrderId: string }
  | { provider: "stripe"; stripeSessionId: string };

/**
 * Re-validates items and shipping against the database (never trusts
 * client-sent prices) and creates the order + order_items rows. Shared by
 * the PayPal capture route and the Stripe webhook so both payment
 * providers go through the same anti-tampering checks.
 */
export async function createOrderFromItems(
  shopSlug: string,
  items: CheckoutItem[],
  shippingMethod: string | null,
  buyer: Buyer,
  payment: PaymentRef
) {
  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, mondial_relay_price, chronopost_price")
    .eq("slug", shopSlug)
    .single();

  if (!shop) {
    throw new Error("shop_not_found");
  }

  const shippingPrice = resolveShippingPrice(shop, shippingMethod);

  const variantIds = items.map((item) => item.variantId);
  const { data: variants } = await admin
    .from("variants")
    .select("id, size, color, products(id, name, price, shop_id)")
    .in("id", variantIds);

  if (!variants || variants.length !== variantIds.length) {
    throw new Error("invalid_items");
  }

  let total = 0;
  const orderItemsToInsert = [];

  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;

    if (!variant || !product || product.shop_id !== shop.id || item.quantity < 1) {
      throw new Error("invalid_items");
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
      payment_provider: payment.provider,
      paypal_order_id: payment.provider === "paypal" ? payment.paypalOrderId : null,
      stripe_session_id: payment.provider === "stripe" ? payment.stripeSessionId : null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error("order_creation_failed");
  }

  await admin
    .from("order_items")
    .insert(orderItemsToInsert.map((item) => ({ ...item, order_id: order.id })));

  return order.id as string;
}
