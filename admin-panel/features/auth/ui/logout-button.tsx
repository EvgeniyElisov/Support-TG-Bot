"use client";

import { useFormStatus } from "react-dom";

import { logoutAction } from "../api/logout";

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#c8ff3d]/35 hover:bg-[#c8ff3d]/10 hover:text-[#e8ffc4] disabled:cursor-not-allowed disabled:opacity-60"
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
