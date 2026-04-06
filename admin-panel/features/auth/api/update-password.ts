"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

const MIN_PASSWORD_LENGTH = 8;

export type UpdatePasswordActionState = { error: string } | null;

export async function updatePasswordAction(
  _prevState: UpdatePasswordActionState,
  formData: FormData,
): Promise<UpdatePasswordActionState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || typeof confirmPassword !== "string") {
    return { error: "Заполните поля пароля" };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Пароль не короче ${MIN_PASSWORD_LENGTH} символов` };
  }

  if (password !== confirmPassword) {
    return { error: "Пароли не совпадают" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Сессия недействительна. Запросите восстановление пароля снова.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
