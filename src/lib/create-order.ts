import { createAdminClient } from "@/lib/supabase/admin-client";
import { resolveShippingPrice } from "@/lib/shipping";
import { sendOrderEmails } from "@/lib/email";
import { formatOrderNumber } from "@/lib/order-number";

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
    .select("id, name, mondial_relay_price, chronopost_price")
    .eq("slug", shopSlug)
    .single();

  if (!shop) {
    throw new Error("shop_not_found");
  }

  const shippingPrice = resolveShippingPrice(shop, shippingMethod);

  const variantIds = items.map((item) => item.variantId);
  const { data: variants } = await admin
    .from("variants")
    .select("id, size, color, stock, products(id, name, price, shop_id)")
    .in("id", variantIds);

  if (!variants || variants.length !== variantIds.length) {
    console.error("[createOrder] variants not found. Got:", variants?.length, "expected:", variantIds.length);
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

    if (variant.stock !== null && variant.stock < item.quantity) {
      throw new Error("out_of_stock");
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
    .select("id, order_number, created_at")
    .single();

  if (orderError || !order) {
    console.error("[createOrder] orders insert failed:", orderError);
    throw new Error("order_creation_failed");
  }

  await admin
    .from("order_items")
    .insert(orderItemsToInsert.map((item) => ({ ...item, order_id: order.id })));

  // Récupère les images pour l'email (requête séparée, ne bloque pas la commande)
  const productIds = orderItemsToInsert.map((i) => i.product_id);
  const { data: productImages } = await admin
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", productIds)
    .order("position");

  const firstImageByProduct: Record<string, string> = {};
  for (const img of productImages ?? []) {
    if (!firstImageByProduct[img.product_id]) {
      firstImageByProduct[img.product_id] = img.url;
    }
  }

  const emailItems = orderItemsToInsert.map((item) => ({
    ...item,
    image_url: firstImageByProduct[item.product_id] ?? null,
  }));

  // Décrémente le stock de chaque variante commandée
  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    if (variant?.stock !== null && variant?.stock !== undefined) {
      await admin
        .from("variants")
        .update({ stock: Math.max(0, variant.stock - item.quantity) })
        .eq("id", item.variantId);
    }
  }

  // Best-effort: notification emails should never block order creation,
  // which has already succeeded by this point.
  try {
    const { data: sellerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("shop_id", shop.id)
      .eq("role", "seller")
      .single();

    const sellerEmail = sellerProfile
      ? (await admin.auth.admin.getUserById(sellerProfile.id)).data.user?.email ?? null
      : null;

    await sendOrderEmails(
      {
        orderId: order.id,
        orderNumber: formatOrderNumber(order.order_number, order.created_at),
        shopName: shop.name,
        buyerFirstname: buyer.firstname,
        buyerName: buyer.name,
        buyerEmail: buyer.email,
        buyerPhone: buyer.phone,
        buyerAddress: buyer.address,
        buyerZip: buyer.zip,
        buyerCity: buyer.city,
        items: emailItems,
        shippingMethod,
        shippingPrice,
        totalPrice: total + shippingPrice,
      },
      sellerEmail
    );
  } catch (err) {
    console.error("Order confirmation emails failed", err);
  }

  return order.id as string;
}
