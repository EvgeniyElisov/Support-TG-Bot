import type { MessageRecord } from "../model/types";
import { MessageCard } from "./message-card";

type MessageListProps = {
  messages: MessageRecord[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/12 bg-black/15 px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">В этом диалоге пока нет сообщений на странице.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Лента</p>
      <ol className="relative list-none">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
      </ol>
    </div>
  );
}
