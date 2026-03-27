import Link from "next/link";

import { formatMessageDate, getDisplayName } from "../lib";
import type { MessageDialogRecord } from "../model/types";

type DialogListProps = {
  dialogs: MessageDialogRecord[];
  selectedChatId: number | null;
};

export function DialogList({ dialogs, selectedChatId }: DialogListProps) {
  if (dialogs.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/80 p-4 text-sm text-zinc-400">
        Диалогов пока нет.
      </div>
    );
  }

  return (
    <ul className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
      {dialogs.map((dialog) => {
        const isActive = dialog.chat_id === selectedChatId;

        return (
          <li key={dialog.chat_id}>
            <Link
              href={`/?chat=${dialog.chat_id}&page=1`}
              className={`block rounded-xl border p-3 transition-all ${
                isActive
                  ? "border-indigo-400/80 bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-900/40"
                  : "border-zinc-700/70 bg-zinc-900/80 text-zinc-100 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-800/90"
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{getDisplayName(dialog)}</span>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    isActive
                      ? "border-indigo-200/60 bg-indigo-200/25 text-indigo-50"
                      : "border-zinc-600 bg-zinc-800 text-zinc-300"
                  }`}
                >
                  chat
                </span>
              </div>
              <div className={`text-xs ${isActive ? "text-indigo-100/90" : "text-zinc-400"}`}>
                chat_id: {dialog.chat_id}
              </div>
              <div className={`mt-1 text-xs ${isActive ? "text-indigo-100/90" : "text-zinc-400"}`}>
                {dialog.messages_count} сообщений · {formatMessageDate(dialog.last_message_at)}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
