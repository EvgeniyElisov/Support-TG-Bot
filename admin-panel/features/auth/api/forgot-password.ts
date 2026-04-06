"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

export type ForgotPasswordActionState = { error: string } | { success: true } | null;

async function getAppOrigin(): Promise<string | null> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) {
    return siteUrl;
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }

  return null;
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim() : "";

  if (!email) {
    return { error: "Укажите email" };
  }

  const origin = await getAppOrigin();
  if (!origin) {
    return {
      error:
        "Не удалось определить адрес приложения. Задайте переменную NEXT_PUBLIC_SITE_URL.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
