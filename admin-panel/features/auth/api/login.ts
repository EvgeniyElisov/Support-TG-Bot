"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

export type LoginActionState = { error: string } | null;

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard?login=success");
}
