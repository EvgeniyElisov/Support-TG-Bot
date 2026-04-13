"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

export type SetClientAssignmentState = { error: string } | null;

/** Для useActionState на форме назначения менеджера. */
export async function setClientAssignmentAction(
  _prev: SetClientAssignmentState,
  formData: FormData,
): Promise<SetClientAssignmentState> {
  const clientId = formData.get("client_id");
  const assignedToRaw = formData.get("assigned_to");

  if (typeof clientId !== "string" || clientId.length === 0) {
    return { error: "Некорректный клиент" };
  }

  const assignedUuid =
    typeof assignedToRaw === "string" && assignedToRaw.length > 0 ? assignedToRaw : null;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_client_assignment", {
    p_client_id: clientId,
    p_current_manager_id: assignedUuid,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return null;
}
