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
    <li className="relative pl-6 last:[&>div]:pb-3">
      <span
        className="absolute left-0 top-3 z-10 h-2.5 w-2.5 rounded-full border-2 border-[#08070b] bg-[#c8ff3d] shadow-[0_0_12px_rgba(200,255,61,0.45)]"
        aria-hidden
      />
      <div className="border-l border-white/10 pb-8 pl-5 pt-0.5 last:border-l-transparent">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-100">{getDisplayName(message)}</span>
          <time
            className="text-[11px] font-medium tabular-nums text-zinc-500"
            dateTime={message.created_at}
          >
            {formatMessageDate(message.created_at)}
          </time>
        </div>
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-zinc-300">
          {getDisplayText(message)}
        </p>
        <p className="mt-3 text-[10px] font-mono text-zinc-600">chat_id {message.chat_id}</p>
      </div>
    </li>
  );
}
