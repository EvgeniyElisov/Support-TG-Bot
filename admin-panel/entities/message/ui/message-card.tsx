import type { MessageRecord } from "../model/types";
import {
  formatMessageDate,
  getDisplayName,
  getDisplayText,
} from "../lib/message-formatters";

type MessageCardProps = {
  message: MessageRecord;
};

export function MessageCard({ message }: MessageCardProps) {
  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-zinc-900">{getDisplayName(message)}</span>
        <span className="text-xs text-zinc-500">{formatMessageDate(message.created_at)}</span>
      </div>

      <p className="mb-3 whitespace-pre-wrap wrap-break-word text-zinc-800">
        {getDisplayText(message)}
      </p>

      <div className="text-xs text-zinc-500">Telegram chat id: {message.chat_id}</div>
    </li>
  );
}
