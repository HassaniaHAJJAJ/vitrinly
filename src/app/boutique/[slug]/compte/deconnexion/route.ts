import { NextRequest, NextResponse } from "next/server";
import { deleteBuyerSession } from "@/lib/buyer-auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await deleteBuyerSession(slug);
  return NextResponse.redirect(new URL(`/boutique/${slug}`, request.url));
}
