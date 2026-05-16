import { getSupabaseAdmin } from "./supabase-admin.ts"

/** Сохраняет исходящее сообщение бота в БД (видно в админке). */
export async function persistBotOutbound(clientId: string, text: string): Promise<void> {
  const db = getSupabaseAdmin()
  if (!db) return

  const nowIso = new Date().toISOString()
  const { error } = await db.from("messages").insert({
    client_id: clientId,
    text_content: text,
    direction: "outbound",
    delivered_at: nowIso,
    sent_by_manager_id: null,
  })

  if (error) {
    console.error("[messages] Ошибка сохранения bot-reply:", error.message)
  }
}
