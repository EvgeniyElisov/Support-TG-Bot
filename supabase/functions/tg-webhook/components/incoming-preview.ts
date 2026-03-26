import type { Context } from "grammy"

/** Текст для эхо-ответа и логов: обычный текст, подпись к медиа или заглушка. */
export function getIncomingPreview(ctx: Context): string {
  const msg = ctx.msg
  if (!msg) return "(нет message в апдейте)"
  if (msg.text) return msg.text
  if ("caption" in msg && msg.caption) return msg.caption
  return "(Не текст: фото, стикер и т.д.)"
}
