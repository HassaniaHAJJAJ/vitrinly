import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createOrderFromItems, type CheckoutItem, type Buyer } from "@/lib/create-order";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string; metadata: Record<string, string> | null };
    const metadata = session.metadata;

    if (!metadata?.shop_slug || !metadata.items || !metadata.buyer) {
      return NextResponse.json({ error: "missing_metadata" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: existingOrder } = await admin
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingOrder) {
      return NextResponse.json({ received: true });
    }

    const items = JSON.parse(metadata.items) as CheckoutItem[];
    const buyer = JSON.parse(metadata.buyer) as Buyer;
    const shippingMethod = metadata.shipping_method || null;

    try {
      await createOrderFromItems(metadata.shop_slug, items, shippingMethod, buyer, {
        provider: "stripe",
        stripeSessionId: session.id,
      });
    } catch (err) {
      // Returning 500 makes Stripe retry the webhook automatically.
      console.error("Stripe webhook order creation failed", err);
      return NextResponse.json({ error: "order_creation_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
