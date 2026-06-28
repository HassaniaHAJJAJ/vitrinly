"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { verifyPassword, createBuyerSession } from "@/lib/buyer-auth";

export async function signInBuyer(shopId: string, shopSlug: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/boutique/${shopSlug}/compte/connexion?error=champs_manquants`);
  }

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("buyer_accounts")
    .select("id, password_hash, email_verified")
    .eq("shop_id", shopId)
    .eq("email", email)
    .single();

  if (!account || !(await verifyPassword(password, account.password_hash))) {
    redirect(`/boutique/${shopSlug}/compte/connexion?error=identifiants`);
  }

  if (!account.email_verified) {
    redirect(`/boutique/${shopSlug}/compte/connexion?error=email_non_verifie`);
  }

  await createBuyerSession(account.id, shopSlug);
  redirect(`/boutique/${shopSlug}/compte`);
}
