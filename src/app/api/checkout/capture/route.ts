import { NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/paypal";
import { createOrderFromItems, type CheckoutItem, type Buyer } from "@/lib/create-order";

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

  let capture;
  try {
    capture = await capturePaypalOrder(paypalOrderId);
  } catch {
    return NextResponse.json({ error: "paypal_capture_failed" }, { status: 500 });
  }

  if (capture.status !== "COMPLETED") {
    return NextResponse.json({ error: "payment_not_completed" }, { status: 400 });
  }

  try {
    const orderId = await createOrderFromItems(shopSlug, items, shippingMethod, buyer, {
      provider: "paypal",
      paypalOrderId,
    });
    return NextResponse.json({ orderId });
  } catch {
    return NextResponse.json({ error: "order_creation_failed" }, { status: 500 });
  }
}
