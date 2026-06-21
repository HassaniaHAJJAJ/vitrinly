"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { type CartItem, cartTotal, getCart, saveCart } from "@/lib/cart";

type Buyer = {
  firstname: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
};

type ShippingMethod = "mondial_relay" | "chronopost";

const EMPTY_BUYER: Buyer = {
  firstname: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  zip: "",
  city: "",
};

const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  mondial_relay: "Mondial Relay",
  chronopost: "Chronopost",
};

export function CheckoutForm({
  shopSlug,
  accentColor,
  shippingOptions,
}: {
  shopSlug: string;
  accentColor: string;
  shippingOptions: Partial<Record<ShippingMethod, number | null>>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyer, setBuyer] = useState<Buyer>(EMPTY_BUYER);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableShippingMethods = (Object.keys(SHIPPING_LABELS) as ShippingMethod[]).filter(
    (method) => shippingOptions[method] != null
  );
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | "">("");

  useEffect(() => {
    setItems(getCart(shopSlug));
    setLoaded(true);
  }, [shopSlug]);

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const buyerComplete = Object.values(buyer).every((v) => v.trim().length > 0);
  const shippingRequired = availableShippingMethods.length > 0;
  const shippingPrice = shippingMethod ? (shippingOptions[shippingMethod] ?? 0) : 0;
  const total = cartTotal(items) + shippingPrice;
  const readyToPay = buyerComplete && (!shippingRequired || shippingMethod !== "");

  if (!loaded) return null;

  if (items.length === 0) {
    return <p className="opacity-70">Ton panier est vide.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-col gap-2 border-b pb-4">
        {items.map((item) => (
          <li key={item.variantId} className="flex justify-between text-sm">
            <span>
              {item.name} ({item.size} / {item.color}) × {item.quantity}
            </span>
            <span>{(item.price * item.quantity).toFixed(2)} €</span>
          </li>
        ))}
        {shippingMethod && (
          <li className="flex justify-between text-sm">
            <span>Livraison ({SHIPPING_LABELS[shippingMethod]})</span>
            <span>{shippingPrice.toFixed(2)} €</span>
          </li>
        )}
        <li className="flex justify-between pt-2 text-base font-semibold">
          <span>Total</span>
          <span style={{ color: accentColor }}>{total.toFixed(2)} €</span>
        </li>
      </ul>

      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BuyerField label="Prénom" value={buyer.firstname} onChange={(v) => setBuyer({ ...buyer, firstname: v })} />
        <BuyerField label="Nom" value={buyer.name} onChange={(v) => setBuyer({ ...buyer, name: v })} />
        <BuyerField label="Email" type="email" value={buyer.email} onChange={(v) => setBuyer({ ...buyer, email: v })} />
        <BuyerField label="Téléphone" value={buyer.phone} onChange={(v) => setBuyer({ ...buyer, phone: v })} />
        <div className="sm:col-span-2">
          <BuyerField label="Adresse" value={buyer.address} onChange={(v) => setBuyer({ ...buyer, address: v })} />
        </div>
        <BuyerField label="Code postal" value={buyer.zip} onChange={(v) => setBuyer({ ...buyer, zip: v })} />
        <BuyerField label="Ville" value={buyer.city} onChange={(v) => setBuyer({ ...buyer, city: v })} />
      </form>

      {shippingRequired && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Mode de livraison *</p>
          <div className="flex flex-col gap-2">
            {availableShippingMethods.map((method) => (
              <label
                key={method}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shipping_method"
                    checked={shippingMethod === method}
                    onChange={() => setShippingMethod(method)}
                  />
                  {SHIPPING_LABELS[method]}
                </span>
                <span>{(shippingOptions[method] ?? 0).toFixed(2)} €</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!paypalClientId ? (
        <p className="rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          Le paiement PayPal n&apos;est pas encore configuré pour cette boutique.
        </p>
      ) : (
        <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "EUR" }}>
          <PayPalButtons
            disabled={!readyToPay}
            createOrder={async () => {
              setError(null);
              const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  shopSlug,
                  items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
                  shippingMethod: shippingMethod || null,
                }),
              });
              const data = await res.json();
              if (!res.ok) {
                setError("Impossible de démarrer le paiement. Réessaie.");
                throw new Error(data.error);
              }
              return data.id;
            }}
            onApprove={async (data) => {
              const res = await fetch("/api/checkout/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  shopSlug,
                  paypalOrderId: data.orderID,
                  items: items.map((i) => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    quantity: i.quantity,
                  })),
                  shippingMethod: shippingMethod || null,
                  buyer,
                }),
              });
              const result = await res.json();
              if (!res.ok) {
                setError("Le paiement a été reçu mais la commande n'a pas pu être enregistrée.");
                return;
              }

              saveCart(shopSlug, []);
              router.push(`/boutique/${shopSlug}/commande/confirmation?order=${result.orderId}`);
            }}
            onError={() => setError("Une erreur est survenue pendant le paiement.")}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
}

function BuyerField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label} *</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-3 py-2"
      />
    </div>
  );
}
