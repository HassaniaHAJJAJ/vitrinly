"use server";

import { createClient } from "@/lib/supabase/server";

export async function getVariantsStock(
  variantIds: string[]
): Promise<{ id: string; stock: number | null }[]> {
  if (variantIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("variants")
    .select("id, stock")
    .in("id", variantIds);
  return (data ?? []).map((v) => ({ id: v.id, stock: v.stock }));
}
