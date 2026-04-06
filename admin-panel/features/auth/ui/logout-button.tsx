"use client";

import { useFormStatus } from "react-dom";

import { logoutAction } from "../api/logout";

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700/80 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Выход…" : "Выйти"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton />
    </form>
  );
}
