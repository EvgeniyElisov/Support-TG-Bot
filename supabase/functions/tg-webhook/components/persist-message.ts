import type { Message } from "grammy/types"
import { getSupabaseAdmin } from "./supabase-admin.ts"

/** Сохранение в public.messages; при редактировании — upsert по (chat_id, message_id). */
export async function persistIncomingMessage(msg: Message): Promise<void> {
  const db = getSupabaseAdmin()
  if (!db) {
    console.warn("Supabase не настроен: нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY")
    return
  }

  const from = msg.from
  const row = {
    chat_id: msg.chat.id,
    user_id: from?.id ?? null,
    username: from?.username ?? null,
    first_name: from?.first_name ?? null,
    last_name: from?.last_name ?? null,
    message_id: msg.message_id,
    text_content: "text" in msg && msg.text ? msg.text : null,
    caption: "caption" in msg && msg.caption ? msg.caption : null,
    raw: JSON.parse(JSON.stringify(msg)) as Record<string, unknown>,
  }

  const { error } = await db.from("messages").upsert(row, {
    onConflict: "chat_id,message_id",
  })

  if (error) {
    console.error("[messages] Ошибка сохранения в БД:", error.message)
  }
}
