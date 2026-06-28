import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { createBuyerSession } from "@/lib/buyer-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const token = request.nextUrl.searchParams.get("token");
  const base = new URL(`/boutique/${slug}`, request.url);

  if (!token) {
    return NextResponse.redirect(new URL(`/boutique/${slug}/compte/connexion`, request.url));
  }

  const admin = createAdminClient();

  const { data: shop } = await admin
    .from("shops")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!shop) return NextResponse.redirect(base);

  const { data: account } = await admin
    .from("buyer_accounts")
    .select("id, email_verified")
    .eq("verification_token", token)
    .eq("shop_id", shop.id)
    .single();

  if (!account) {
    return NextResponse.redirect(
      new URL(`/boutique/${slug}/compte/connexion?error=lien_invalide`, request.url)
    );
  }

  if (!account.email_verified) {
    await admin
      .from("buyer_accounts")
      .update({ email_verified: true })
      .eq("id", account.id);
  }

  await createBuyerSession(account.id, slug);
  return NextResponse.redirect(new URL(`/boutique/${slug}/compte`, request.url));
}
