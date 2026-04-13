"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  updatePasswordAction,
  type UpdatePasswordActionState,
} from "../api/update-password";

const inputClassName =
  "w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 text-sm text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-600 focus:border-[#c8ff3d]/45 focus:ring-2 focus:ring-[#c8ff3d]/15";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, formAction, isPending] = useActionState<
    UpdatePasswordActionState,
    FormData
  >(updatePasswordAction, null);

  useEffect(() => {
    if (!state?.error) return;
    toast.error(state.error, { id: "update-password-error" });
  }, [state?.error]);

  return (
    <form className="flex flex-col gap-4" action={formAction} noValidate>
      <h2 className="sr-only">Смена пароля</h2>
      <p className="mb-1 text-center text-sm text-zinc-500">
        Придумайте новый пароль для входа в панель.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="new-password">
          Пароль
        </label>
        <input
          autoComplete="new-password"
          className={inputClassName}
          disabled={isPending}
          id="new-password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="confirm-password">
          Повторите пароль
        </label>
        <input
          autoComplete="new-password"
          className={inputClassName}
          disabled={isPending}
          id="confirm-password"
          name="confirmPassword"
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={confirmPassword}
        />
      </div>

      <button
        className="font-heading mt-1 w-full rounded-xl bg-[#c8ff3d] px-4 py-3.5 text-sm font-bold tracking-wide text-black shadow-[0_0_40px_-8px_rgba(200,255,61,0.45)] transition hover:-translate-y-0.5 hover:bg-[#d8ff6a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff3d]/80 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Сохранение…" : "Сохранить пароль"}
      </button>
    </form>
  );
}
