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
      <h2 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Учётные данные
      </h2>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-zinc-400" htmlFor="login-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-zinc-700/70 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 shadow-md shadow-black/20 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/40"
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
          className="w-full rounded-xl border border-zinc-700/70 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 shadow-md shadow-black/20 outline-none transition placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/40"
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
          className="text-sm text-indigo-400/90 transition hover:text-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60"
          onClick={() => setView("forgot")}
          type="button"
        >
          Забыли пароль?
        </button>
      </div>

      <button
        className="mt-1 w-full rounded-xl border border-indigo-400/80 bg-linear-to-br from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:-translate-y-0.5 hover:from-indigo-600 hover:to-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/80 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
