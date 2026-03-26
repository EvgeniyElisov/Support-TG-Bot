import { Bot, type Context, webhookCallback } from "grammy"
import { getIncomingPreview } from "./incoming-preview.ts"
import { persistIncomingMessage } from "./persist-message.ts"

/** Сборка Bot, обработчики message / edited_message, HTTP-адаптер std/http для вебхука. */
export function createWebhookHandler(token: string) {
  const bot = new Bot(token)

  async function onMessageOrEdited(ctx: Context) {
    const from = ctx.from
    const fromLabel = from
      ? `${from.username ? ` @${from.username}` : ""} ${[from.first_name, from.last_name].filter(Boolean).join(" ")}`.trim()
      : "(Отправитель неизвестен)"
    console.log("Входящее сообщение от", fromLabel, ":", getIncomingPreview(ctx))
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
