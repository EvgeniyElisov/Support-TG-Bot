"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

import type { DialogStatus } from "@/entities/message/model/dialog-status";

export type SetDialogStatusState = { error: string } | null;

export async function setClientDialogStatusAction(
  _prev: SetDialogStatusState,
  formData: FormData,
): Promise<SetDialogStatusState> {
  const clientId = formData.get("client_id");
  const statusRaw = formData.get("dialog_status");

  if (typeof clientId !== "string" || clientId.length === 0) {
    return { error: "Некорректный диалог" };
  }

  if (typeof statusRaw !== "string") {
    return { error: "Некорректный статус" };
  }

  const allowed: DialogStatus[] = ["new", "in_progress", "waiting_client", "closed"];
  if (!allowed.includes(statusRaw as DialogStatus)) {
    return { error: "Некорректный статус" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_client_dialog_status", {
    p_client_id: clientId,
    p_status: statusRaw,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return null;
}
