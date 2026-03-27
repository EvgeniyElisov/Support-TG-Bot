import type { MessageRecord } from "../model/types";
import { MessageCard } from "./message-card";

type MessageListProps = {
  messages: MessageRecord[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Сообщений пока нет.
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </ul>
  );
}
