import Link from "next/link";

import { LogoutButton } from "@/features/auth";

type DashboardShellProps = {
  userEmail: string | null;
  children: React.ReactNode;
};

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#08070b]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/dashboard" className="font-heading text-lg font-bold tracking-tight text-zinc-50">
          Support
        </Link>
        <LogoutButton />
      </header>

      <aside className="relative hidden w-[min(100%,272px)] shrink-0 flex-col border-white/10 bg-black/25 py-8 pl-6 pr-5 lg:flex lg:border-r">
        <div className="pointer-events-none absolute inset-y-8 right-0 w-px bg-linear-to-b from-transparent via-[#c8ff3d]/20 to-transparent" />
        <Link href="/dashboard" className="group mb-10 block">
          <div className="font-heading text-xl font-bold tracking-tight text-zinc-50">Support</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.35em] text-zinc-600 transition group-hover:text-zinc-500">
            console
          </div>
        </Link>

        <nav className="flex flex-col gap-1" aria-label="Разделы">
          <Link
            href="/dashboard"
            className="rounded-xl border border-[#c8ff3d]/25 bg-[#c8ff3d]/8 px-3 py-2.5 text-sm font-semibold text-[#e8ffc4] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          >
            Входящие
          </Link>
        </nav>

        <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
          {userEmail ? (
            <p className="truncate text-xs leading-relaxed text-zinc-500" title={userEmail}>
              {userEmail}
            </p>
          ) : null}
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
