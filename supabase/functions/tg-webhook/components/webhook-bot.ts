import { Bot, type Context, webhookCallback } from "grammy"
import { getIncomingPreview } from "./incoming-preview.ts"
import { persistIncomingMessage } from "./persist-message.ts"
import { generateRagAnswer, RagNotReadyError } from "./rag.ts"

/** Сборка Bot, обработчики message / edited_message, HTTP-адаптер std/http для вебхука. */
export function createWebhookHandler(token: string) {
  const bot = new Bot(token)

  function isStartCommand(ctx: Context): boolean {
    if (!ctx.msg || !("text" in ctx.msg) || !ctx.msg.text) return false
    const command = ctx.msg.text.trim().split(/\s+/)[0]
    return command === "/start" || command.startsWith("/start@")
  }

  async function onMessageOrEdited(ctx: Context) {
    const from = ctx.from
    const fromLabel = from
      ? `${from.username ? ` @${from.username}` : ""} ${[from.first_name, from.last_name].filter(Boolean).join(" ")}`.trim()
      : "(Отправитель неизвестен)"
    console.log("Входящее сообщение от", fromLabel, ":", getIncomingPreview(ctx))
    if (!ctx.msg) return

    if (isStartCommand(ctx)) {
      await ctx.reply(
        [
          "Здравствуйте! Чем могу помочь?",
          "Подскажу по заказу, доставке, сборке, возврату, гарантии и комплектации — отвечу на основе доступной информации.",
          "Также могу помочь с вопросами по каталогу, материалам и ориентировочным ценам.",
          "",
        ].join("\n"),
      )
      return
    }

    await persistIncomingMessage(ctx.msg)

    // RAG-ответ только на новые сообщения (не на edits) и только когда есть текст.
    if (ctx.update.edited_message) return
    const text =
      ("text" in ctx.msg && ctx.msg.text) || ("caption" in ctx.msg && ctx.msg.caption) || null
    if (!text) return

    try {
      const { answer } = await generateRagAnswer(text)
      await ctx.reply(answer)
    } catch (e) {
      console.error("[rag]", e)
      if (e instanceof RagNotReadyError) {
        await ctx.reply(
          "Сейчас я не могу ответить по базе знаний. Попробуйте повторить чуть позже или переформулируйте вопрос.",
        )
        return
      }

      await ctx.reply("Не получилось сформировать ответ. Попробуйте переформулировать вопрос или повторите позже.")
    }
  }

  bot.on("message", onMessageOrEdited)
  bot.on("edited_message", onMessageOrEdited)

  return webhookCallback(bot, "std/http")
}
