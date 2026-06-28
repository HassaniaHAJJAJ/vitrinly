import { createAdminClient } from "@/lib/supabase/admin-client";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "buyer_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createBuyerSession(buyerAccountId: string, shopSlug: string) {
  const admin = createAdminClient();
  const { data: session } = await admin
    .from("buyer_sessions")
    .insert({ buyer_account_id: buyerAccountId })
    .select("token")
    .single();

  if (!session) throw new Error("session_creation_failed");

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: `/boutique/${shopSlug}/`,
  });
}

export async function getBuyerSession(shopSlug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("buyer_sessions")
    .select("buyer_account_id, buyer_accounts(id, shop_id, email, firstname, lastname, phone, address, zip, city, shops(slug))")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!data) return null;

  const account = Array.isArray(data.buyer_accounts) ? data.buyer_accounts[0] : data.buyer_accounts as any;
  const shop = Array.isArray(account?.shops) ? account.shops[0] : account?.shops;

  if (shop?.slug !== shopSlug) return null;

  return account as {
    id: string;
    shop_id: string;
    email: string;
    firstname: string;
    lastname: string;
    phone: string | null;
    address: string | null;
    zip: string | null;
    city: string | null;
  };
}

export async function deleteBuyerSession(shopSlug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const admin = createAdminClient();
    await admin.from("buyer_sessions").delete().eq("token", token);
  }

  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: `/boutique/${shopSlug}/`,
  });
}
