import { Bot, type Context, webhookCallback } from "grammy"

import { isDialogAssignedToManager } from "./dialog-assignment.ts"
import { getIncomingPreview } from "./incoming-preview.ts"
import { persistBotOutbound } from "./persist-bot-outbound.ts"
import { persistIncomingMessage } from "./persist-message.ts"
import { generateRagAnswer, RagNotReadyError } from "./rag.ts"

const START_REPLY = [
  "Здравствуйте! Чем могу помочь?",
  "Подскажу по заказу, доставке, сборке, возврату, гарантии и комплектации — отвечу на основе доступной информации.",
  "Также могу помочь с вопросами по каталогу, материалам и ориентировочным ценам.",
].join("\n")

const KB_NOT_READY_REPLY =
  "Сейчас я не могу ответить по базе знаний. Попробуйте повторить чуть позже или переформулируйте вопрос."

const GENERIC_ERROR_REPLY =
  "Не получилось сформировать ответ. Попробуйте переформулировать вопрос или повторите позже."

/** Сборка Bot, обработчики message / edited_message, HTTP-адаптер std/http для вебхука. */
export function createWebhookHandler(token: string) {
  const bot = new Bot(token)

  function isStartCommand(ctx: Context): boolean {
    if (!ctx.msg || !("text" in ctx.msg) || !ctx.msg.text) return false
    const command = ctx.msg.text.trim().split(/\s+/)[0]
    return command === "/start" || command.startsWith("/start@")
  }

  function getMessageText(ctx: Context): string | null {
    if (!ctx.msg) return null
    return ("text" in ctx.msg && ctx.msg.text) || ("caption" in ctx.msg && ctx.msg.caption) || null
  }

  async function replyAndPersist(clientId: string | null, text: string, ctx: Context): Promise<void> {
    await ctx.reply(text)
    if (clientId) await persistBotOutbound(clientId, text)
  }

  async function onMessageOrEdited(ctx: Context) {
    const from = ctx.from
    const fromLabel = from
      ? `${from.username ? ` @${from.username}` : ""} ${[from.first_name, from.last_name].filter(Boolean).join(" ")}`.trim()
      : "(Отправитель неизвестен)"
    console.log("Входящее сообщение от", fromLabel, ":", getIncomingPreview(ctx))
    if (!ctx.msg) return

    if (isStartCommand(ctx)) {
      const clientId = await persistIncomingMessage(ctx.msg)
      await replyAndPersist(clientId, START_REPLY, ctx)
      return
    }

    const clientId = await persistIncomingMessage(ctx.msg)

    // RAG-ответ только на новые сообщения (не на edits) и только когда есть текст.
    if (ctx.update.edited_message) return
    const text = getMessageText(ctx)
    if (!text) return

    if (clientId && (await isDialogAssignedToManager(clientId))) {
      return
    }

    try {
      const { answer } = await generateRagAnswer(text)
      await replyAndPersist(clientId, answer, ctx)
    } catch (e) {
      console.error("[rag]", e)
      if (e instanceof RagNotReadyError) {
        await replyAndPersist(clientId, KB_NOT_READY_REPLY, ctx)
        return
      }

      await replyAndPersist(clientId, GENERIC_ERROR_REPLY, ctx)
    }
  }

  bot.on("message", onMessageOrEdited)
  bot.on("edited_message", onMessageOrEdited)

  return webhookCallback(bot, "std/http")
}
