import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";
import { UpdatePasswordPage } from "@/views/update-password";

export default async function UpdatePasswordRoute() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=password_reset_session");
  }

  return <UpdatePasswordPage />;
}
