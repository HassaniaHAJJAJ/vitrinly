export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string | null;
  quantity: number;
};

function cartKey(shopSlug: string) {
  return `vitrineasy_cart_${shopSlug}`;
}

export function getCart(shopSlug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cartKey(shopSlug));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(shopSlug: string, items: CartItem[]) {
  window.localStorage.setItem(cartKey(shopSlug), JSON.stringify(items));
  window.dispatchEvent(new Event("vitrineasy-cart-updated"));
}

export function addToCart(shopSlug: string, item: CartItem) {
  const items = getCart(shopSlug);
  const existing = items.find((i) => i.variantId === item.variantId);

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    items.push(item);
  }

  saveCart(shopSlug, items);
  return items;
}

export function removeFromCart(shopSlug: string, variantId: string) {
  const items = getCart(shopSlug).filter((i) => i.variantId !== variantId);
  saveCart(shopSlug, items);
  return items;
}

export function updateQuantity(shopSlug: string, variantId: string, quantity: number) {
  const items = getCart(shopSlug);
  const item = items.find((i) => i.variantId === variantId);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  saveCart(shopSlug, items);
  return items;
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
