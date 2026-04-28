import { getSupabaseAdmin } from "./supabase-admin.ts"

type RetrievedChunk = {
  id: string
  document_id: string
  chunk_index: number
  chunk_text: string
  similarity: number
}

export class RagNotReadyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RagNotReadyError"
  }
}

function isGreetingOrTooVague(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return true
  if (/^(привет|здравств(уй|уйте)|добрый\s+(день|вечер)|hello|hi)\b/i.test(t)) return true
  const wordCount = t.split(/\s+/).filter(Boolean).length
  return wordCount <= 2
}

function buildClarifyingReply(question: string): string {
  const q = question.trim().toLowerCase()

  const wantsOrder =
    /(заказ|заказа|статус|номер|трек|доставка|курьер|интервал|адрес)/i.test(q)
  const aboutDamage = /(поврежден|поврежд|дефект|скол|царап|полом|разбит|трещин)/i.test(q)
  const aboutMissing = /(не\s*хватает|нет\s+в\s+комплекте|комплект|фурнитур|детал)/i.test(q)
  const aboutReturn = /(возврат|обмен|вернут|отмен|компенсац)/i.test(q)
  const aboutCatalog = /(каталог|цена|стоим|модель|бренд|материал|обивк|ткан)/i.test(q)

  const questions: string[] = []
  if (wantsOrder || aboutDamage || aboutMissing || aboutReturn) {
    questions.push("Подскажите, пожалуйста, номер заказа и город доставки.")
  } else if (aboutCatalog) {
    questions.push("Какая модель/категория интересует и какой город доставки?")
  } else {
    questions.push("Опишите, пожалуйста, что именно случилось и по какому заказу (если есть номер).")
  }

  if (aboutDamage) {
    questions.push("Можете приложить фото/видео повреждения и упаковки?")
  } else if (aboutMissing) {
    questions.push("Каких деталей или фурнитуры не хватает? Есть фото коробок/этикеток?")
  } else if (aboutReturn) {
    questions.push("Товар уже получен? В каком состоянии упаковка и есть ли дефекты?")
  } else if (wantsOrder) {
    questions.push("Что нужно уточнить: статус, дата/интервал доставки или изменение заказа?")
  } else if (aboutCatalog) {
    questions.push("Какие параметры важны: размер, материал/обивка, цвет и бюджет?")
  } else {
    questions.push("Уточните, пожалуйста, тему: заказ, доставка, сборка, гарантия, возврат или каталог?")
  }

  const unique = Array.from(new Set(questions)).slice(0, 2)

  return [
    "Похоже, вопрос пока слишком общий — уточните пару деталей, и я отвечу точнее.",
    "",
    ...unique.map((s) => `- ${s}`),
  ].join("\n")
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`${name} is not set`)
  return v
}

async function embedQuery(text: string): Promise<number[]> {
  const provider = (Deno.env.get("EMBEDDINGS_PROVIDER") ?? "openai").toLowerCase()
  if (provider === "none") {
    throw new RagNotReadyError("Embeddings disabled (EMBEDDINGS_PROVIDER=none)")
  }

  const baseUrl = (Deno.env.get("EMBEDDINGS_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "")
  const apiKey = Deno.env.get("EMBEDDINGS_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? ""
  const model = Deno.env.get("EMBEDDINGS_MODEL") ?? "text-embedding-3-small"
  const openRouterReferer = Deno.env.get("OPENROUTER_HTTP_REFERER") ?? ""
  const openRouterTitle = Deno.env.get("OPENROUTER_X_TITLE") ?? ""
  if (!apiKey) {
    throw new RagNotReadyError("No embeddings API key (set EMBEDDINGS_API_KEY or OPENAI_API_KEY)")
  }

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(openRouterReferer ? { "HTTP-Referer": openRouterReferer } : {}),
      ...(openRouterTitle ? { "X-Title": openRouterTitle } : {}),
    },
    body: JSON.stringify({ model, input: text }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Embeddings failed: ${body || res.statusText}`)
  }

  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> }
  const emb = json.data?.[0]?.embedding
  if (!Array.isArray(emb)) throw new Error("Embeddings response missing embedding")
  return emb
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`
}

async function retrieveChunks(question: string, topK = 6): Promise<RetrievedChunk[]> {
  const db = getSupabaseAdmin()
  if (!db) throw new Error("Supabase admin is not configured")

  const queryEmbedding = await embedQuery(question)
  const queryEmbeddingLiteral = toVectorLiteral(queryEmbedding)

  const { data, error } = await (
    db as unknown as {
      rpc: (
        fn: string,
        args: unknown,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    }
  ).rpc("match_kb_chunks", {
    query_embedding: queryEmbeddingLiteral,
    match_count: topK,
  })

  if (error) throw new Error(`match_kb_chunks error: ${error.message}`)
  return (data ?? []) as RetrievedChunk[]
}

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const header = `Источник ${i + 1} (similarity=${c.similarity.toFixed(3)}, chunk=${c.chunk_index}, doc=${c.document_id})`
      return `${header}\n${c.chunk_text}`
    })
    .join("\n\n---\n\n")
}

async function callDeepSeek(system: string, user: string): Promise<string> {
  const apiKey = requireEnv("DEEPSEEK_API_KEY")
  const model = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-v4-flash"

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`DeepSeek failed: ${body || res.statusText}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error("DeepSeek response missing content")
  return content
}

export async function generateRagAnswer(question: string): Promise<{
  answer: string
  used_chunks: RetrievedChunk[]
}> {
  if (isGreetingOrTooVague(question)) {
    return { answer: buildClarifyingReply(question), used_chunks: [] }
  }

  const chunks = await retrieveChunks(question, Number(Deno.env.get("RAG_TOP_K") ?? "6"))
  const minSim = Number(Deno.env.get("RAG_MIN_SIMILARITY") ?? "0.78")
  const bestSim = chunks[0]?.similarity ?? 0
  if (chunks.length === 0 || bestSim < minSim) {
    return { answer: buildClarifyingReply(question), used_chunks: chunks }
  }
  const context = buildContext(chunks)

  const system = [
    "Ты — ассистент службы поддержки. Отвечай кратко, по делу, на русском.",
    "Используй ТОЛЬКО информацию из блока КОНТЕКСТ ниже.",
    "Если в контексте нет ответа — скажи, что информации недостаточно, и задай 1-2 уточняющих вопроса.",
  ].join("\n")

  const user = `ВОПРОС:\n${question}\n\nКОНТЕКСТ:\n${context || "(контекст не найден)"}`
  const answer = await callDeepSeek(system, user)

  return { answer, used_chunks: chunks }
}

