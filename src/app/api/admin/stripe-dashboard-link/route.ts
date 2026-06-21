import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  await requireAdmin();

  const { shopId } = await request.json();
  if (!shopId) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: shop } = await admin
    .from("shops")
    .select("stripe_account_id")
    .eq("id", shopId)
    .single();

  if (!shop?.stripe_account_id) {
    return NextResponse.json({ error: "stripe_not_connected" }, { status: 400 });
  }

  const loginLink = await getStripe().accounts.createLoginLink(shop.stripe_account_id);
  return NextResponse.json({ url: loginLink.url });
}
