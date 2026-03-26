import { createWebhookHandler } from "./webhook-bot.ts"

/**
 * HTTP-обёртка: GET — health (OK), POST — тело Update в grammY.
 * Токен: TELEGRAM_BOT_TOKEN (локально — .env при `supabase functions serve`, в облаке — secrets).
 */
export function startHttpServer(): void {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? ""
  const handleWebhook = token ? createWebhookHandler(token) : null

  Deno.serve(async (req) => {
    if (req.method === "GET") {
      return new Response("OK", { status: 200 })
    }

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
      console.error("[tg-webhook]", e)
      return new Response(JSON.stringify({ ok: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
  })
}
