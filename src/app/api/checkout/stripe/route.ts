import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe } from "@/lib/stripe";
import { resolveShippingPrice } from "@/lib/shipping";

type CheckoutItem = { productId: string; variantId: string; quantity: number };

export async function POST(request: Request) {
  const { shopSlug, items, shippingMethod, buyer } = (await request.json()) as {
    shopSlug: string;
    items: CheckoutItem[];
    shippingMethod: string | null;
    buyer: Record<string, string>;
  };

  if (!shopSlug || !Array.isArray(items) || items.length === 0 || !buyer) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id, slug, stripe_account_id, stripe_onboarding_complete, mondial_relay_price, chronopost_price")
    .eq("slug", shopSlug)
    .single();

  if (!shop || !shop.stripe_account_id || !shop.stripe_onboarding_complete) {
    return NextResponse.json({ error: "shop_not_payable" }, { status: 400 });
  }

  let shippingPrice: number;
  try {
    shippingPrice = resolveShippingPrice(shop, shippingMethod);
  } catch {
    return NextResponse.json({ error: "invalid_shipping_method" }, { status: 400 });
  }

  const variantIds = items.map((item) => item.variantId);
  const { data: variants } = await admin
    .from("variants")
    .select("id, products(id, name, price, shop_id)")
    .in("id", variantIds);

  if (!variants || variants.length !== variantIds.length) {
    return NextResponse.json({ error: "invalid_items" }, { status: 400 });
  }

  const lineItems = [];
  for (const item of items) {
    const variant = variants.find((v) => v.id === item.variantId);
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;

    if (!variant || !product || product.shop_id !== shop.id || item.quantity < 1) {
      return NextResponse.json({ error: "invalid_items" }, { status: 400 });
    }

    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: product.name },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: item.quantity,
    });
  }

  if (shippingPrice > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: `Livraison (${shippingMethod})` },
        unit_amount: Math.round(shippingPrice * 100),
      },
      quantity: 1,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: buyer.email,
    payment_intent_data: {
      transfer_data: { destination: shop.stripe_account_id },
    },
    metadata: {
      shop_slug: shopSlug,
      shipping_method: shippingMethod ?? "",
      items: JSON.stringify(items),
      buyer: JSON.stringify(buyer),
    },
    success_url: `${siteUrl}/boutique/${shop.slug}/commande/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/boutique/${shop.slug}/commande`,
  });

  return NextResponse.json({ url: session.url });
}
