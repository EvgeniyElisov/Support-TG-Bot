"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "../api/forgot-password";

type ForgotPasswordFormProps = {
  onBack: () => void;
};

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState<
    ForgotPasswordActionState,
    FormData
  >(forgotPasswordAction, null);

  useEffect(() => {
    if (!state) return;
    if ("error" in state && state.error) {
      toast.error(state.error, { id: "forgot-password-error" });
    }
    if ("success" in state && state.success) {
      toast.success(
        "Если аккаунт с этим email есть, мы отправили ссылку для сброса пароля.",
        { id: "forgot-password-success" },
      );
    }
  }, [state]);

  return (
    <form className="flex flex-col gap-4" action={formAction} noValidate>
      <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Восстановление пароля
      </h2>
      <p className="mb-2 text-center text-sm text-zinc-400">
        Введите email — пришлём ссылку для нового пароля.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="forgot-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-zinc-700/70 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 shadow-md shadow-black/20 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/40"
          disabled={isPending}
          id="forgot-email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <button
        className="mt-1 w-full rounded-xl border border-indigo-400/80 bg-linear-to-br from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 hover:from-indigo-600 hover:to-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/80 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Отправка…" : "Отправить ссылку"}
      </button>

      <button
        className="text-center text-sm text-indigo-400/90 transition hover:text-indigo-300 disabled:opacity-50"
        disabled={isPending}
        onClick={onBack}
        type="button"
      >
        ← Назад к входу
      </button>
    </form>
  );
}
