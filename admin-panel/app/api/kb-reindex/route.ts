import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

type ReindexRequest = {
  document_id?: unknown;
};

type KbDocumentRow = {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
};

type Chunk = {
  chunk_index: number;
  chunk_text: string;
  token_count: number | null;
};

function toVectorLiteral(embedding: number[]): string {
  // pgvector input literal format: [0.1,0.2,...]
  // PostgREST reliably accepts this string for `vector` columns.
  return `[${embedding.join(",")}]`;
}

function chunkText(input: string, opts?: { maxChars?: number; overlapChars?: number }): Chunk[] {
  const maxChars = Math.max(300, opts?.maxChars ?? 1400);
  const overlapChars = Math.max(0, Math.min(maxChars - 50, opts?.overlapChars ?? 180));

  const text = input.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  // Split by paragraphs but keep content dense.
  const paras = text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (!buf) {
      buf = p;
      continue;
    }

    if ((buf.length + 2 + p.length) <= maxChars) {
      buf = `${buf}\n\n${p}`;
      continue;
    }

    chunks.push(buf);
    // Start next buffer with overlap tail.
    const tail = overlapChars > 0 ? buf.slice(Math.max(0, buf.length - overlapChars)) : "";
    buf = tail ? `${tail}\n\n${p}` : p;
  }
  if (buf) chunks.push(buf);

  return chunks.map((chunk_text, i) => ({
    chunk_index: i,
    chunk_text,
    token_count: null,
  }));
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const provider = (process.env.EMBEDDINGS_PROVIDER ?? "openai").toLowerCase();

  if (provider === "none") {
    return texts.map(() => []);
  }

  // OpenAI-compatible embeddings endpoint by default.
  const baseUrl = process.env.EMBEDDINGS_BASE_URL ?? "https://api.openai.com/v1";
  const apiKey = process.env.EMBEDDINGS_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  const model = process.env.EMBEDDINGS_MODEL ?? "text-embedding-3-small";
  const openRouterReferer = process.env.OPENROUTER_HTTP_REFERER ?? "";
  const openRouterTitle = process.env.OPENROUTER_X_TITLE ?? "";

  if (!apiKey) {
    throw new Error(
      "No embeddings API key. Set EMBEDDINGS_API_KEY (or OPENAI_API_KEY), or set EMBEDDINGS_PROVIDER=none to reindex without vectors.",
    );
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(openRouterReferer ? { "HTTP-Referer": openRouterReferer } : {}),
      ...(openRouterTitle ? { "X-Title": openRouterTitle } : {}),
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Embeddings request failed: ${text || res.statusText}`);
  }

  const json = (await res.json()) as unknown;
  const data = (json as { data?: Array<{ embedding?: number[] }> }).data;
  if (!Array.isArray(data) || data.length !== texts.length) {
    throw new Error("Embeddings response shape mismatch.");
  }

  return data.map((d) => {
    if (!Array.isArray(d.embedding)) throw new Error("Missing embedding in response.");
    return d.embedding;
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return new NextResponse("Unauthorized", { status: 401 });

    const payload = (await request.json().catch(() => null)) as ReindexRequest | null;
    const documentId = typeof payload?.document_id === "string" ? payload.document_id : null;

    // Load documents.
    const docsQuery = supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("kb_documents" as any)
      .select("id,title,body,is_published")
      .eq("is_published", true);

    const { data: docsRaw, error: docsError } = documentId
      ? await docsQuery.eq("id", documentId)
      : await docsQuery;

    if (docsError) return new NextResponse(docsError.message, { status: 400 });
    const docs = (docsRaw ?? []) as KbDocumentRow[];

    let totalChunks = 0;
    const provider = (process.env.EMBEDDINGS_PROVIDER ?? "openai").toLowerCase();

    for (const doc of docs) {
      const chunks = chunkText(doc.body);
      totalChunks += chunks.length;

      // Rebuild chunks for this document: delete then insert.
      const { error: delError } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("kb_chunks" as any)
        .delete()
        .eq("document_id", doc.id);
      if (delError) return new NextResponse(delError.message, { status: 400 });

      if (chunks.length === 0) continue;

      // Compute embeddings in batches to avoid big payloads.
      const BATCH = 64;
      for (let i = 0; i < chunks.length; i += BATCH) {
        const batch = chunks.slice(i, i + BATCH);
        let embeddings: number[][] = batch.map(() => []);
        if (provider !== "none") {
          embeddings = await embedTexts(batch.map((c) => c.chunk_text));
        }

        const rows = batch.map((c, idx) => ({
          document_id: doc.id,
          chunk_index: c.chunk_index,
          chunk_text: c.chunk_text,
          token_count: c.token_count,
          embedding:
            provider === "none" ? null : toVectorLiteral(embeddings[idx] ?? []),
        }));

        const { error: insError } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("kb_chunks" as any)
          .insert(rows);
        if (insError) return new NextResponse(insError.message, { status: 400 });
      }
    }

    // Touch updated_at on documents if we reindexed all.
    if (!documentId && docs.length > 0) {
      const ids = docs.map((d) => d.id);
      await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from("kb_documents" as any)
        .update({ updated_at: new Date().toISOString() })
        .in("id", ids);
    }

    return NextResponse.json({
      ok: true,
      documents: docs.length,
      chunks: totalChunks,
      embeddings_provider: provider,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(message, { status: 500 });
  }
}

