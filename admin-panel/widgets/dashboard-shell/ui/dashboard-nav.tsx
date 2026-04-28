"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const activeClass =
  "rounded-xl border border-[#c8ff3d]/25 bg-[#c8ff3d]/8 px-3 py-2.5 text-sm font-semibold text-[#e8ffc4] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const inactiveClass =
  "rounded-xl border border-white/10 bg-white/2 px-3 py-2.5 text-sm font-semibold text-zinc-200 hover:border-white/15 hover:bg-white/4";

export function DashboardNav() {
  const pathname = usePathname();
  const isDialogs = pathname === "/dashboard";
  const isKb = pathname === "/dashboard/kb";

  return (
    <nav className="flex flex-col gap-1" aria-label="Разделы">
      <Link href="/dashboard" className={cx(isDialogs ? activeClass : inactiveClass)}>
        Диалоги
      </Link>
      <Link href="/dashboard/kb" className={cx(isKb ? activeClass : inactiveClass)}>
        База знаний
      </Link>
    </nav>
  );
}

