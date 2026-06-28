"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { hashPassword } from "@/lib/buyer-auth";
import { Resend } from "resend";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function requestPasswordReset(shopId: string, shopSlug: string, shopName: string, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect(`/boutique/${shopSlug}/compte/mot-de-passe-oublie?error=email_manquant`);

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("buyer_accounts")
    .select("id")
    .eq("shop_id", shopId)
    .eq("email", email)
    .single();

  if (account) {
    const { data: reset } = await admin
      .from("buyer_password_resets")
      .insert({ buyer_account_id: account.id })
      .select("token")
      .single();

    if (reset) {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
      if (apiKey) {
        const resend = new Resend(apiKey);
        const link = `${SITE_URL}/boutique/${shopSlug}/compte/reinitialiser?token=${reset.token}`;
        await resend.emails.send({
          from: `${shopName} <${from}>`,
          to: email,
          subject: `Réinitialisation de ton mot de passe — ${shopName}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
              <h1 style="font-size:20px;">Réinitialiser ton mot de passe</h1>
              <p>Clique sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable 1 heure.</p>
              <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none;font-size:14px;">
                Réinitialiser mon mot de passe
              </a>
              <p style="font-size:12px;color:#999;">Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
            </div>`,
        });
      }
    }
  }

  // Toujours rediriger vers la même page de succès (ne pas révéler si le compte existe)
  redirect(`/boutique/${shopSlug}/compte/mot-de-passe-oublie?sent=1`);
}

export async function resetPassword(shopSlug: string, token: string, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!password || password.length < 8) {
    redirect(`/boutique/${shopSlug}/compte/reinitialiser?token=${token}&error=mdp_court`);
  }
  if (password !== confirm) {
    redirect(`/boutique/${shopSlug}/compte/reinitialiser?token=${token}&error=mdp_different`);
  }

  const admin = createAdminClient();
  const { data: reset } = await admin
    .from("buyer_password_resets")
    .select("id, buyer_account_id, expires_at, used")
    .eq("token", token)
    .single();

  if (!reset || reset.used || new Date(reset.expires_at) < new Date()) {
    redirect(`/boutique/${shopSlug}/compte/reinitialiser?token=${token}&error=lien_invalide`);
  }

  const password_hash = await hashPassword(password);
  await Promise.all([
    admin.from("buyer_accounts").update({ password_hash }).eq("id", reset.buyer_account_id),
    admin.from("buyer_password_resets").update({ used: true }).eq("id", reset.id),
  ]);

  redirect(`/boutique/${shopSlug}/compte/connexion?success=mdp_modifie`);
}
