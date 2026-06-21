"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/dashboard/reinitialiser-mot-de-passe`,
  });

  // Always show the same confirmation, whether or not the email exists,
  // so we don't leak which addresses have an account.
  redirect("/dashboard/mot-de-passe-oublie?sent=1");
}
