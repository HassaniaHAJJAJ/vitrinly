export type ShippingMethod = "mondial_relay" | "chronopost";

export function resolveShippingPrice(
  shop: { mondial_relay_price: number | null; chronopost_price: number | null },
  shippingMethod: string | null
) {
  if (!shippingMethod) return 0;

  if (shippingMethod === "mondial_relay" && shop.mondial_relay_price != null) {
    return shop.mondial_relay_price;
  }
  if (shippingMethod === "chronopost" && shop.chronopost_price != null) {
    return shop.chronopost_price;
  }

  throw new Error("invalid_shipping_method");
}
