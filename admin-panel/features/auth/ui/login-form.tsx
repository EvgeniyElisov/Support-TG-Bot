"use client";

import { useActionState, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { loginAction, type LoginActionState } from "../api/login";

import { ForgotPasswordForm } from "./forgot-password-form";

export function LoginForm() {
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    loginAction,
    null,
  );

  useEffect(() => {
    if (!state?.error) return;
    toast.error(state.error, { id: "login-error" });
  }, [state?.error]);

  if (view === "forgot") {
    return <ForgotPasswordForm onBack={() => setView("login")} />;
  }

  return (
    <form className="flex flex-col gap-4" action={formAction} noValidate>
      <h2 className="mb-1 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Учётные данные
      </h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="login-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 text-sm text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-600 focus:border-[#c8ff3d]/45 focus:ring-2 focus:ring-[#c8ff3d]/15"
          disabled={isPending}
          id="login-email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="login-password">
          Пароль
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 text-sm text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-600 focus:border-[#c8ff3d]/45 focus:ring-2 focus:ring-[#c8ff3d]/15"
          disabled={isPending}
          id="login-password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          type="password"
          value={password}
        />
      </div>

      <div className="flex justify-end">
        <button
          className="text-sm text-zinc-500 transition hover:text-[#c8ff3d] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff3d]/45"
          onClick={() => setView("forgot")}
          type="button"
        >
          Забыли пароль?
        </button>
      </div>

      <button
        className="font-heading mt-1 w-full rounded-xl bg-[#c8ff3d] px-4 py-3.5 text-sm font-bold tracking-wide text-black shadow-[0_0_40px_-8px_rgba(200,255,61,0.45)] transition hover:-translate-y-0.5 hover:bg-[#d8ff6a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff3d]/80 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
