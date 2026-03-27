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
    <li className="rounded-2xl border border-zinc-700/60 bg-zinc-900/85 p-5 shadow-md shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-zinc-500 hover:shadow-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-1 font-semibold text-zinc-100 ring-1 ring-zinc-700/70">
          {getDisplayName(message)}
        </span>
        <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-1 text-xs font-medium text-zinc-400">
          {formatMessageDate(message.created_at)}
        </span>
      </div>

      <p className="mb-3 whitespace-pre-wrap wrap-break-word leading-relaxed text-zinc-100">
        {getDisplayText(message)}
      </p>

      <div className="text-xs text-zinc-400">Telegram chat id: {message.chat_id}</div>
    </li>
  );
}
