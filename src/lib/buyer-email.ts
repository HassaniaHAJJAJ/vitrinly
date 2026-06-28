import { Resend } from "resend";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function from(shopName: string) {
  const email = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  return `${shopName} <${email}>`;
}

export async function sendVerificationEmail({
  email,
  firstname,
  shopName,
  shopSlug,
  shopLogoUrl,
  token,
}: {
  email: string;
  firstname: string;
  shopName: string;
  shopSlug: string;
  shopLogoUrl?: string | null;
  token: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const link = `${SITE_URL}/boutique/${shopSlug}/compte/verifier?token=${token}`;
  const logoHtml = shopLogoUrl
    ? `<img src="${shopLogoUrl}" alt="${shopName}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;">`
    : "";

  await resend.emails.send({
    from: from(shopName),
    to: email,
    subject: `Confirme ton adresse email — ${shopName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <div style="text-align:center;padding:32px 0 24px;">
          ${logoHtml}
          <p style="margin:0;font-weight:600;font-size:16px;">${shopName}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin-bottom:24px;">
        <h1 style="font-size:20px;margin-top:0;">Bienvenue ${firstname} ! 🎉</h1>
        <p>Merci de créer un compte chez <strong>${shopName}</strong>.</p>
        <p>Clique sur le bouton ci-dessous pour confirmer ton adresse email et accéder à ton compte.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${link}" style="display:inline-block;padding:14px 28px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
            Confirmer mon adresse email
          </a>
        </div>
        <p style="font-size:12px;color:#999;">Ce lien est valable 24 heures. Si tu n'es pas à l'origine de cette inscription, ignore cet email.</p>
      </div>`,
  });
}
