import type { Message } from "grammy/types"
import { getSupabaseAdmin } from "./supabase-admin.ts"

/** Сохранение клиента и строки сообщения (только text_content в БД). */
export async function persistIncomingMessage(msg: Message): Promise<void> {
  const db = getSupabaseAdmin()
  if (!db) {
    console.warn("Supabase не настроен: нет SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY")
    return
  }

  const from = msg.from
  const nowIso = new Date().toISOString()

  const profile = {
    telegram_user_id: from?.id ?? null,
    username: from?.username ?? null,
    first_name: from?.first_name ?? null,
    last_name: from?.last_name ?? null,
    updated_at: nowIso,
  }

  const { data: existing, error: existingError } = await db
    .from("clients")
    .select("id")
    .eq("chat_id", msg.chat.id)
    .maybeSingle()

  if (existingError) {
    console.error("[clients] Ошибка чтения:", existingError.message)
    return
  }

  let clientRow: { id: string }

  if (existing) {
    const { error: updError } = await db
      .from("clients")
      .update(profile)
      .eq("id", existing.id)

    if (updError) {
      console.error("[clients] Ошибка update:", updError.message)
      return
    }
    clientRow = { id: existing.id }
  } else {
    const { data: inserted, error: insError } = await db
      .from("clients")
      .insert({
        chat_id: msg.chat.id,
        ...profile,
      })
      .select("id")
      .single()

    if (insError || !inserted) {
      console.error("[clients] Ошибка insert:", insError?.message)
      return
    }
    clientRow = inserted
  }

  const textContent =
    "text" in msg && msg.text
      ? msg.text
      : "caption" in msg && msg.caption
        ? msg.caption
        : null

  const { error } = await db.from("messages").insert({
    client_id: clientRow.id,
    text_content: textContent,
    direction: "inbound",
  })

  if (error) {
    console.error("[messages] Ошибка сохранения в БД:", error.message)
  }
}
