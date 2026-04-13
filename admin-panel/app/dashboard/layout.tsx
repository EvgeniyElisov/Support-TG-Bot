import { Metadata } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";
import { DashboardShell } from "@/widgets/dashboard-shell";

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
    <DashboardShell userEmail={user.email ?? null}>{children}</DashboardShell>
  );
}
