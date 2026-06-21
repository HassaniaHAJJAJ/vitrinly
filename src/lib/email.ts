import { Resend } from "resend";

export type EmailOrderItem = {
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price: number;
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

function fromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "Vitrinly <onboarding@resend.dev>";
}

function itemsHtml(items: EmailOrderItem[]) {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 0;">${item.product_name} (${item.size} / ${item.color}) × ${item.quantity}</td>
          <td style="padding:4px 0; text-align:right;">${(item.unit_price * item.quantity).toFixed(2)} €</td>
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

  const buyerEmailPromise = resend.emails.send({
    from: fromAddress(),
    to: order.buyerEmail,
    subject: `Ta commande ${order.orderNumber} a bien été reçue 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size:20px;">Merci ${order.buyerFirstname} !</h1>
        <p>Ta commande <strong>${order.orderNumber}</strong> chez <strong>${order.shopName}</strong> a bien été reçue et va être préparée rapidement.</p>
        ${recapTable}
        <p style="margin-top:24px; font-size:13px; color:#666;">
          Livraison à : ${order.buyerAddress}, ${order.buyerZip} ${order.buyerCity}
        </p>
      </div>`,
  });

  const sellerEmailPromise = sellerEmail
    ? resend.emails.send({
        from: fromAddress(),
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
                Voir la commande sur Vitrinly →
              </a>
            </p>
          </div>`,
      })
    : null;

  // Best-effort: a failed email should never break order creation, which has
  // already succeeded by the time this runs.
  await Promise.allSettled([buyerEmailPromise, sellerEmailPromise]);
}
