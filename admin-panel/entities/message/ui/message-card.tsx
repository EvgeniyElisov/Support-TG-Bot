import type { MessageRecord } from "../model/types";
import {
  formatMessageDate,
  getDisplayName,
  getDisplayText,
} from "../lib/message-formatters";

type MessageCardProps = {
  message: MessageRecord;
};

function formatSenderLabel(message: MessageRecord): string {
  if (message.direction === "outbound") {
    const n = [message.manager_first_name, message.manager_last_name].filter(Boolean).join(" ");
    const role = message.manager_company_role ? ` · ${message.manager_company_role}` : "";
    return n ? `Ответ поддержки: ${n}${role}` : "Ответ поддержки";
  }
  return getDisplayName(message);
}

function formatOutboundStatus(message: MessageRecord): string | null {
  if (message.direction !== "outbound") return null;
  if (message.failed_at) return "Failed";
  if (message.read_at) return "Read";
  if (message.delivered_at) return "Delivered";
  return "Sent";
}

export function MessageCard({ message }: MessageCardProps) {
  const isOutbound = message.direction === "outbound";
  const status = formatOutboundStatus(message);

  const statusLabel =
    status === "Delivered" ? "Delivered" : status === "Failed" ? "Failed" : status === "Read" ? "Read" : "Sent";

  return (
    <li className="relative pl-6 last:[&>div]:pb-3">
      <span
        className={`absolute left-0 top-3 z-10 h-2.5 w-2.5 rounded-full border-2 border-[#08070b] shadow-[0_0_12px_rgba(200,255,61,0.35)] ${
          isOutbound ? "bg-[#2dd4bf]" : "bg-[#c8ff3d]"
        }`}
        aria-hidden
      />
      <div className="border-l border-white/10 pb-8 pl-5 pt-0.5 last:border-l-transparent">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className={`text-sm font-semibold ${isOutbound ? "text-teal-200/95" : "text-zinc-100"}`}
          >
            {formatSenderLabel(message)}
          </span>
          <div className="flex items-center gap-2">
            {status ? (
              <span
                className={`rounded-lg border px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-[0.14em] ${
                  status === "Failed"
                    ? "border-rose-400/35 bg-rose-400/15 text-rose-200 shadow-[0_0_22px_-12px_rgba(251,113,133,0.9)]"
                    : status === "Delivered"
                      ? "border-[#2dd4bf]/35 bg-[#2dd4bf]/15 text-[#9af3e7] shadow-[0_0_22px_-12px_rgba(45,212,191,0.9)]"
                      : status === "Read"
                        ? "border-[#c8ff3d]/30 bg-[#c8ff3d]/12 text-[#e8ffc4] shadow-[0_0_20px_-14px_rgba(200,255,61,0.9)]"
                        : "border-white/10 bg-white/6 text-zinc-300"
                }`}
                title={status === "Failed" ? message.send_error ?? "Send failed" : undefined}
              >
                {statusLabel}
              </span>
            ) : null}
            <time
              className="text-[11px] font-medium tabular-nums text-zinc-500"
              dateTime={message.created_at}
            >
              {formatMessageDate(message.created_at)}
            </time>
          </div>
        </div>
        <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-zinc-300">
          {getDisplayText(message)}
        </p>
        {!isOutbound ? (
          <p className="mt-3 text-[10px] font-mono text-zinc-600">chat_id {message.chat_id}</p>
        ) : null}
      </div>
    </li>
  );
}
