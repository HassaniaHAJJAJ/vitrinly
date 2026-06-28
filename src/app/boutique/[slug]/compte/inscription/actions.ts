"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { hashPassword } from "@/lib/buyer-auth";
import { sendVerificationEmail } from "@/lib/buyer-email";

export async function signUpBuyer(shopId: string, shopSlug: string, shopName: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstname = String(formData.get("firstname") ?? "").trim();
  const lastname = String(formData.get("lastname") ?? "").trim();

  if (!email || !password || !firstname || !lastname) {
    redirect(`/boutique/${shopSlug}/compte/inscription?error=champs_manquants`);
  }
  if (password.length < 8) {
    redirect(`/boutique/${shopSlug}/compte/inscription?error=mdp_court`);
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("buyer_accounts")
    .select("id")
    .eq("shop_id", shopId)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    redirect(`/boutique/${shopSlug}/compte/inscription?error=email_existe`);
  }

  const password_hash = await hashPassword(password);
  const { data: account, error } = await admin
    .from("buyer_accounts")
    .insert({ shop_id: shopId, email, password_hash, firstname, lastname })
    .select("id, verification_token")
    .single();

  if (error || !account) {
    redirect(`/boutique/${shopSlug}/compte/inscription?error=serveur`);
  }

  await sendVerificationEmail({ email, firstname, shopName, shopSlug, token: account.verification_token });
  redirect(`/boutique/${shopSlug}/compte/inscription?sent=1`);
}
