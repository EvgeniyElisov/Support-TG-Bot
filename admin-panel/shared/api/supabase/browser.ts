import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase-database";

let client: SupabaseClient<Database> | null = null;

/**
 * Клиент для Client Components: те же cookie-сессии, что и на сервере (singleton в браузере).
 */
export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }

  if (!client) {
    client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return client;
}
