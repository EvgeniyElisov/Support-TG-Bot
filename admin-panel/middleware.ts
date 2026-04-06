import { type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/shared/api/supabase/update-session";

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

/* Литерал нужен Next.js для статического разбора; логика — в shared/api/supabase/update-session */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
