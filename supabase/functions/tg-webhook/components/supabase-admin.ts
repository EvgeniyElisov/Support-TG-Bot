import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются в Edge Functions автоматически.
let supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!url || !key) return null
  supabaseAdmin = createClient(url, key)
  return supabaseAdmin
}
