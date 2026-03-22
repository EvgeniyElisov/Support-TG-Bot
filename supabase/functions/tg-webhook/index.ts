/**
 * Вебхук Telegram: Telegram POST-ит сюда JSON Update, grammY обрабатывает и отвечает в чат.
 * Токен: TELEGRAM_BOT_TOKEN (локально — .env при `supabase functions serve`, в облаке — `supabase secrets set`).
 * Документация адаптера: https://grammy.dev/guide/deployment-types.html
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { Bot, type Context, webhookCallback } from "grammy"
import type { Message } from "grammy/types"

// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются в Edge Functions автоматически.
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin
  const url = Deno.env.get("SUPABASE_URL") ?? ""
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  if (!url || !key) return null
  supabaseAdmin = createClient(url, key)
  return supabaseAdmin
}

/** Сохранение в public.messages; при редактировании — upsert по (chat_id, message_id). */
async function persistIncomingMessage(msg: Message): Promise<void> {
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

// Текст для эхо-ответа: обычный текст, подпись к медиа или заглушка, если текста нет.
function getIncomingPreview(ctx: Context): string {
  const msg = ctx.msg
  if (!msg) return "(нет message в апдейте)"
  if (msg.text) return msg.text
  if ("caption" in msg && msg.caption) return msg.caption
  return "(Не текст: фото, стикер и т.д.)"
}

// Собираем Bot, вешаем обработчики и возвращаем HTTP-обёртку под Deno.serve (адаптер "std/http").
function createWebhookHandler(token: string) {
  const bot = new Bot(token)

  async function onMessageOrEdited(ctx: Context) {
    // Текст/подпись сообщения — в логах Supabase: Dashboard → Edge Functions → Logs
    const from = ctx.from
    const fromLabel = from
      ? `${from.username ? ` @${from.username}` : ""} ${[from.first_name, from.last_name].filter(Boolean).join(" ")}`.trim()
      : "(Отправитель неизвестен)"
    console.log("Входящee сообщение от", fromLabel, ":", getIncomingPreview(ctx))
    if (!ctx.msg) return

    await persistIncomingMessage(ctx.msg)

    const preview = getIncomingPreview(ctx)
    await ctx.reply(
      `Привет, я получил твое сообщение, вот оно: ${preview}`,
      {
        reply_parameters: { message_id: ctx.msg.message_id },
      },
    )
  }

  bot.on("message", onMessageOrEdited)
  bot.on("edited_message", onMessageOrEdited)

  return webhookCallback(bot, "std/http")
}

const token = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? ""
const handleWebhook = token ? createWebhookHandler(token) : null

Deno.serve(async (req) => {
  // Проверка доступности URL (браузер, curl, health-check).
  if (req.method === "GET") {
    return new Response("OK", { status: 200 })
  }

  // Вебхук Telegram присылает только POST с телом Update.
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  if (!handleWebhook) {
    console.error("TELEGRAM_BOT_TOKEN не задан")
    return new Response(JSON.stringify({ ok: false, error: "missing token" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    return await handleWebhook(req)
  } catch (e) {
    // Ошибка обработки апдейта (в т.ч. таймаут middleware в grammY — см. доку выше).
    console.error("[tg-webhook]", e)
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }
})
