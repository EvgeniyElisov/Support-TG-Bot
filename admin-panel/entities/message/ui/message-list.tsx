import type { MessageRecord } from "../model/types";
import { MessageCard } from "./message-card";

type MessageListProps = {
  messages: MessageRecord[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/80 p-6 text-sm text-zinc-400 shadow-sm">
        Сообщений пока нет.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </ul>
  );
}
