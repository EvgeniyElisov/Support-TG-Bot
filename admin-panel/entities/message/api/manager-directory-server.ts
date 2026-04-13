import { createSupabaseServerClient } from "@/shared/api/supabase/server";

import type { ManagerDirectoryEntry } from "../model/types";

export async function getManagersDirectory(): Promise<ManagerDirectoryEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("managers")
    .select("user_id, first_name, last_name, company_role")
    .order("last_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ManagerDirectoryEntry[];
}
