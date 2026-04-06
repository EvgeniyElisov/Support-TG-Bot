import { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";
import { LogoutButton } from "@/features/auth";

export const metadata: Metadata = {
  title: "Панель администратора",
  description: "Панель администратора",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 flex shrink-0 items-center justify-end border-b border-zinc-700/50 bg-zinc-950/90 px-4 py-3 backdrop-blur-md">
        <LogoutButton />
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
