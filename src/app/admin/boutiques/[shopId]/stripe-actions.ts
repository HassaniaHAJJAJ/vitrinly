"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getStripe } from "@/lib/stripe";

export async function connectStripe(shopId: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: shop } = await admin
    .from("shops")
    .select("id, name, stripe_account_id")
    .eq("id", shopId)
    .single();

  if (!shop) {
    redirect(`/admin/boutiques/${shopId}?error=shop`);
  }

  let accountId = shop.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      business_profile: { name: shop.name },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    accountId = account.id;
    await admin.from("shops").update({ stripe_account_id: accountId }).eq("id", shopId);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/admin/boutiques/${shopId}?stripe_refresh=1`,
    return_url: `${siteUrl}/admin/boutiques/${shopId}?stripe_return=1`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
