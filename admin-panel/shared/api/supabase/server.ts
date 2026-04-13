import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/supabase-database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireSupabaseEnv() {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Supabase для Server Components, Server Actions и Route Handlers.
 * Сессия читается и пишется через cookie Next.js (в Server Actions setAll сработает).
 */
export async function createSupabaseServerClient() {
  const { supabaseUrl: url, supabaseAnonKey: key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // В RSC cookie часто только для чтения — refresh делает middleware.
        }
      },
    },
  });
}
