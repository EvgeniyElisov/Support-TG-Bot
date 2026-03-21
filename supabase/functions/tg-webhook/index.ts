/**
 * Вебхук Telegram: Telegram POST-ит сюда JSON Update, grammY обрабатывает и отвечает в чат.
 * Токен: TELEGRAM_BOT_TOKEN (локально — .env при `supabase functions serve`, в облаке — `supabase secrets set`).
 * Документация адаптера: https://grammy.dev/guide/deployment-types.html
 */
import { Bot, type Context, webhookCallback } from "grammy"

// Текст для эхо-ответа: обычный текст, подпись к медиа или заглушка, если текста нет.
function getIncomingPreview(ctx: Context): string {
  const msg = ctx.msg
  if (!msg) return "(нет message в апдейте)"
  if (msg.text) return msg.text
  if ("caption" in msg && msg.caption) return msg.caption
  return "(не текст: фото, стикер и т.д.)"
}

// Собираем Bot, вешаем обработчики и возвращаем HTTP-обёртку под Deno.serve (адаптер "std/http").
function createWebhookHandler(token: string) {
  const bot = new Bot(token)

  async function onMessageOrEdited(ctx: Context) {
    // Полный Update — в логах Supabase: Dashboard → Edge Functions → Logs
    console.log("[tg-webhook] входящий апдейт:", JSON.stringify(ctx.update))
    if (!ctx.msg) return

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
