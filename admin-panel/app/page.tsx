import { MessageList } from "@/entities/message/ui";
import type { MessageRecord } from "@/entities/message/model/types";
import { createSupabaseServerClient } from "@/shared/api/supabase/server";

async function getMessages() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, username, first_name, last_name, created_at, text_content, caption")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MessageRecord[];
}

export default async function Home() {
  const messages = await getMessages();

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          @hug_the_bug_bot — Сообщения
        </h1>
        <p className="mb-6 text-sm text-zinc-600">
          Показаны последние {messages.length} сообщений из Supabase.
        </p>
        <MessageList messages={messages} />
      </main>
    </div>
  );
}
