/** Leitura de `platform_settings` (piso/teto de preço, versões de termos, take rate...). */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPlatformSettings<K extends string>(
  supabase: SupabaseClient,
  keys: K[],
): Promise<Partial<Record<K, unknown>>> {
  const { data, error } = await supabase.from("platform_settings").select("key, value").in("key", keys);
  if (error) throw new Error(`platform_settings: ${error.message}`);
  const out: Partial<Record<K, unknown>> = {};
  for (const row of data ?? []) {
    out[row.key as K] = row.value;
  }
  return out;
}
