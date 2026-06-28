import { Resend } from "resend";

export async function sendReviewRequestEmail({
  buyerEmail,
  buyerFirstname,
  shopName,
  shopLogoUrl,
  products,
  siteUrl,
  isReminder = false,
}: {
  buyerEmail: string;
  buyerFirstname: string;
  shopName: string;
  shopLogoUrl: string | null;
  products: { name: string; token: string; imageUrl?: string | null }[];
  siteUrl: string;
  isReminder?: boolean;
}) {
  const resend = getResend();
  if (!resend) return;

  const logoHtml = shopLogoUrl
    ? `<img src="${shopLogoUrl}" alt="${shopName}" style="height:56px;width:56px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 8px;">`
    : "";

  const productLinks = products
    .map(
      (p) => `
      <a href="${siteUrl}/avis/${p.token}"
         style="display:flex;align-items:center;gap:12px;margin:8px 0;padding:12px;background:#f5f5f5;border-radius:8px;text-decoration:none;color:#111;">
        ${p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:52px;height:52px;object-fit:cover;border-radius:6px;flex-shrink:0;">`
          : `<span style="font-size:20px;">⭐</span>`}
        <span style="font-size:14px;">Donner mon avis sur <strong>${p.name}</strong></span>
      </a>`
    )
    .join("");

  const subject = isReminder
    ? `⏰ Dernière chance — tes 3 points t'attendent chez ${shopName}`
    : `Ton avis vaut 3 points de fidélité chez ${shopName} 🎁`;

  const pointsBadge = `
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;margin:16px 0;text-align:center;">
      <span style="font-size:22px;">🎁</span>
      <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#b45309;">
        ${isReminder ? "Dernière chance : 3 points à récupérer !" : "Laisse ton avis et gagne 3 points de fidélité"}
      </p>
      ${isReminder ? `<p style="margin:4px 0 0;font-size:12px;color:#92400e;">C'est notre dernier rappel — après ça, ces points seront perdus.</p>` : `<p style="margin:4px 0 0;font-size:12px;color:#92400e;">Tes points s'accumulent et te donnent droit à des réductions.</p>`}
    </div>`;

  await resend.emails.send({
    from: fromAddress(shopName),
    to: buyerEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
        <div style="text-align:center;padding:24px 0 16px;">
          ${logoHtml}
          <p style="margin:0;font-weight:600;font-size:15px;">${shopName}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin-bottom:24px;">
        <h1 style="font-size:20px;margin-top:0;">
          ${isReminder ? "On revient vers toi une dernière fois 🙏" : "Ton avis compte beaucoup 💛"}
        </h1>
        <p>Bonjour ${buyerFirstname},</p>
        <p>${isReminder ? "Tu n'as pas encore laissé d'avis sur ta commande, et c'est dommage car tu passes à côté de tes points !" : "Nous espérons que tu es ravie de ta commande ! Quelques secondes suffisent pour aider d'autres clientes à faire leur choix."}</p>
        ${pointsBadge}
        ${productLinks}
        <p style="font-size:12px;color:#999;margin-top:24px;">
          Si tu ne souhaites plus recevoir ces emails, ignore simplement ce message.
        </p>
      </div>`,
  });
}

export type EmailOrderItem = {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
};

export type EmailOrderDetails = {
  orderId: string;
  orderNumber: string;
  shopName: string;
  buyerFirstname: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerZip: string;
  buyerCity: string;
  items: EmailOrderItem[];
  shippingMethod: string | null;
  shippingPrice: number;
  totalPrice: number;
};

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function fromAddress(shopName?: string) {
  const email = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const name = shopName ?? "Vitrineasy";
  return `${name} <${email}>`;
}

function itemsHtml(items: EmailOrderItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0; vertical-align:middle;">
            <div style="display:flex; align-items:center; gap:12px;">
              ${item.image_url
                ? `<img src="${item.image_url}" alt="${item.product_name}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0;">`
                : ""}
              <span>${item.product_name}${item.size || item.color ? ` (${[item.size, item.color].filter(Boolean).join(" / ")})` : ""} × ${item.quantity}</span>
            </div>
          </td>
          <td style="padding:8px 0; text-align:right; vertical-align:middle; white-space:nowrap;">${(item.unit_price * item.quantity).toFixed(2)} €</td>
        </tr>`
    )
    .join("");
}

const SHIPPING_LABELS: Record<string, string> = {
  mondial_relay: "Mondial Relay",
  chronopost: "Chronopost",
};

export async function sendOrderEmails(order: EmailOrderDetails, sellerEmail: string | null) {
  const resend = getResend();
  if (!resend) return; // No API key configured (e.g. local dev without Resend set up).

  const shippingRow = order.shippingMethod
    ? `<tr><td style="padding:4px 0;">Livraison (${SHIPPING_LABELS[order.shippingMethod] ?? order.shippingMethod})</td><td style="padding:4px 0; text-align:right;">${order.shippingPrice.toFixed(2)} €</td></tr>`
    : "";

  const recapTable = `
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      ${itemsHtml(order.items)}
      ${shippingRow}
      <tr><td style="padding:8px 0; font-weight:bold; border-top:1px solid #ddd;">Total</td><td style="padding:8px 0; text-align:right; font-weight:bold; border-top:1px solid #ddd;">${order.totalPrice.toFixed(2)} €</td></tr>
    </table>`;

  const pointsBadge = `
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:12px 16px;margin:20px 0;text-align:center;">
      <span style="font-size:22px;">⭐</span>
      <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#b45309;">Tu viens de gagner 5 points de fidélité !</p>
      <p style="margin:4px 0 0;font-size:12px;color:#92400e;">Ils s'accumulent à chaque achat et te donnent droit à des réductions.</p>
    </div>`;

  const buyerEmailPromise = resend.emails.send({
    from: fromAddress(order.shopName),
    to: order.buyerEmail,
    subject: `Ta commande ${order.orderNumber} a bien été reçue 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size:20px;">Merci ${order.buyerFirstname} !</h1>
        <p>Ta commande <strong>${order.orderNumber}</strong> chez <strong>${order.shopName}</strong> a bien été reçue et va être préparée rapidement.</p>
        ${recapTable}
        ${pointsBadge}
        <p style="margin-top:24px; font-size:13px; color:#666;">
          Livraison à : ${order.buyerAddress}, ${order.buyerZip} ${order.buyerCity}
        </p>
      </div>`,
  });

  const sellerEmailPromise = sellerEmail
    ? resend.emails.send({
        from: fromAddress(order.shopName),
        to: sellerEmail,
        subject: `Nouvelle commande ${order.orderNumber} sur ta boutique !`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h1 style="font-size:20px;">Nouvelle commande ${order.orderNumber} reçue</h1>
            ${recapTable}
            <h2 style="font-size:16px; margin-top:24px;">Coordonnées de l'acheteuse</h2>
            <p style="font-size:14px;">
              ${order.buyerFirstname} ${order.buyerName}<br/>
              ${order.buyerEmail}<br/>
              ${order.buyerPhone}<br/>
              ${order.buyerAddress}, ${order.buyerZip} ${order.buyerCity}
            </p>
            <p style="margin-top:24px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/commandes/${order.orderId}">
                Voir la commande sur Vitrineasy →
              </a>
            </p>
          </div>`,
      })
    : null;

  // Best-effort: a failed email should never break order creation.
  const results = await Promise.allSettled([buyerEmailPromise, sellerEmailPromise]);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[email] Échec envoi email commande:", result.reason);
    } else if (result.value?.error) {
      console.error("[email] Erreur Resend commande:", result.value.error);
    }
  }
}

export async function sendTrackingEmail({
  buyerEmail,
  buyerFirstname,
  orderNumber,
  shopName,
  shopLogoUrl,
  trackingNumber,
}: {
  buyerEmail: string;
  buyerFirstname: string;
  orderNumber: string;
  shopName: string;
  shopLogoUrl: string | null;
  trackingNumber: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const logoHtml = shopLogoUrl
    ? `<img src="${shopLogoUrl}" alt="${shopName}" style="height:64px; width:64px; border-radius:50%; object-fit:cover; display:block; margin: 0 auto 8px;" />`
    : "";

  await resend.emails.send({
    from: fromAddress(shopName),
    to: buyerEmail,
    subject: `Ton colis ${orderNumber} est en route 📦`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; padding: 24px 0 16px;">
          ${logoHtml}
          <p style="margin:0; font-weight:600; font-size:15px;">${shopName}</p>
        </div>
        <hr style="border:none; border-top:1px solid #eee; margin-bottom:24px;" />
        <h1 style="font-size:20px; margin-top:0;">Ton colis est en chemin !</h1>
        <p>Bonjour ${buyerFirstname},</p>
        <p>Ta commande <strong>${orderNumber}</strong> chez <strong>${shopName}</strong> a été expédiée.</p>
        <div style="margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; font-size: 15px;">
          Numéro de suivi : <strong>${trackingNumber}</strong>
        </div>
        <p style="font-size:13px; color:#888;">Tu peux suivre ton colis sur le site du transporteur avec ce numéro.</p>
      </div>`,
  });
}
