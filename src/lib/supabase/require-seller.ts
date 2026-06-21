import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireSeller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, shop_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller" || !profile.shop_id) {
    redirect("/dashboard/login");
  }

  return { supabase, user, shopId: profile.shop_id };
}
