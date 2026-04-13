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
      <h2 className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Восстановление пароля
      </h2>
      <p className="mb-2 text-center text-sm text-zinc-500">
        Введите email — пришлём ссылку для нового пароля.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="forgot-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 text-sm text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-600 focus:border-[#c8ff3d]/45 focus:ring-2 focus:ring-[#c8ff3d]/15"
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
        className="font-heading mt-1 w-full rounded-xl bg-[#c8ff3d] px-4 py-3.5 text-sm font-bold tracking-wide text-black shadow-[0_0_40px_-8px_rgba(200,255,61,0.45)] transition hover:-translate-y-0.5 hover:bg-[#d8ff6a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff3d]/80 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Отправка…" : "Отправить ссылку"}
      </button>

      <button
        className="text-center text-sm text-zinc-500 transition hover:text-[#c8ff3d] disabled:opacity-50 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff3d]/45"
        disabled={isPending}
        onClick={onBack}
        type="button"
      >
        ← Назад к входу
      </button>
    </form>
  );
}
