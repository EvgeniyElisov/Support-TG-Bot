import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

type CreatePayload = {
  title?: unknown;
  body?: unknown;
  tags?: unknown;
  is_published?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as CreatePayload | null;
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  const tags = Array.isArray(payload?.tags) ? payload?.tags.filter((t) => typeof t === "string") : [];
  const is_published = typeof payload?.is_published === "boolean" ? payload.is_published : true;

  if (!title || !body) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("kb_documents" as any)
    .insert({
      title,
      body,
      tags,
      is_published,
      updated_at: new Date().toISOString(),
    });

  if (error) return new NextResponse(error.message, { status: 400 });
  return NextResponse.json({ ok: true });
}

