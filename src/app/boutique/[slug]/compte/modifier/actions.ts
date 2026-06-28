"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getBuyerSession } from "@/lib/buyer-auth";

export async function updateProfile(shopSlug: string, formData: FormData) {
  const account = await getBuyerSession(shopSlug);
  if (!account) redirect(`/boutique/${shopSlug}/compte/connexion`);

  const admin = createAdminClient();
  await admin
    .from("buyer_accounts")
    .update({
      firstname: String(formData.get("firstname") ?? "").trim(),
      lastname: String(formData.get("lastname") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      zip: String(formData.get("zip") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
    })
    .eq("id", account.id);

  redirect(`/boutique/${shopSlug}/compte`);
}
