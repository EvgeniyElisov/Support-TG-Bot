"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  updatePasswordAction,
  type UpdatePasswordActionState,
} from "../api/update-password";

const inputClassName =
  "w-full rounded-xl border border-zinc-700/70 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 shadow-md shadow-black/20 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/40";

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
      <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Новый пароль
      </h2>
      <p className="mb-2 text-center text-xs text-zinc-400">
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
        className="mt-1 w-full rounded-xl border border-indigo-400/80 bg-linear-to-br from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 hover:from-indigo-600 hover:to-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/80 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Сохранение…" : "Сохранить пароль"}
      </button>
    </form>
  );
}
