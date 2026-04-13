import Link from "next/link";

import { formatMessageDate, getAvatarInitial, getDisplayName } from "../lib";
import type { ManagerDirectoryEntry, MessageDialogRecord } from "../model/types";

import { DialogAssignmentSelect } from "./dialog-assignment-select";

type DialogListProps = {
  dialogs: MessageDialogRecord[];
  selectedChatId: number | null;
  managers: ManagerDirectoryEntry[];
  sessionUserId: string | null;
};

export function DialogList({
  dialogs,
  selectedChatId,
  managers,
  sessionUserId,
}: DialogListProps) {
  if (dialogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
        Диалогов пока нет.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {dialogs.map((dialog) => {
        const isActive = dialog.chat_id === selectedChatId;
        const initial = getAvatarInitial(dialog);

        return (
          <li key={dialog.chat_id}>
            <div
              className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                isActive
                  ? "border-[#c8ff3d]/40 bg-linear-to-br from-[#1a2610]/90 via-[#0f1418] to-[#0c1018] shadow-[0_0_28px_-10px_rgba(200,255,61,0.35)]"
                  : "border-white/8 bg-black/15 hover:border-[#2dd4bf]/25 hover:bg-white/6"
              }`}
            >
              <Link href={`/dashboard?chat=${dialog.chat_id}&page=1`} className="block p-3">
                <div className="flex gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      isActive
                        ? "bg-linear-to-br from-[#c8ff3d]/30 to-[#2dd4bf]/20 text-[#f4ffe0] ring-1 ring-[#c8ff3d]/35"
                        : "bg-white/8 text-zinc-300 ring-1 ring-white/10"
                    }`}
                    aria-hidden
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-semibold leading-snug text-zinc-100">
                        {getDisplayName(dialog)}
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isActive
                            ? "bg-[#c8ff3d]/15 text-[#d4ff7a]"
                            : "bg-white/8 text-zinc-500"
                        }`}
                      >
                        {dialog.messages_count}
                      </span>
                    </div>
                    <p className={`mt-1 truncate text-[11px] ${isActive ? "text-zinc-400" : "text-zinc-600"}`}>
                      id {dialog.chat_id} · {formatMessageDate(dialog.last_message_at)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="border-t border-white/8 px-3 pb-3 pt-1">
                <DialogAssignmentSelect
                  dialog={dialog}
                  managers={managers}
                  sessionUserId={sessionUserId}
                  isActive={isActive}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
