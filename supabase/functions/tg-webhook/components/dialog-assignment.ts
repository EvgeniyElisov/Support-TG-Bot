import { getSupabaseAdmin } from "./supabase-admin.ts"

/** true, если на диалог назначен менеджер (бот не должен авто-отвечать). */
export async function isDialogAssignedToManager(clientId: string): Promise<boolean> {
  const db = getSupabaseAdmin()
  if (!db) return false

  const { data: assignment, error } = await db
    .from("client_assignments")
    .select("current_manager_id")
    .eq("client_id", clientId)
    .maybeSingle()

  if (error) {
    console.error("[client_assignments] Ошибка чтения:", error.message)
    return false
  }

  return Boolean(assignment?.current_manager_id)
}
