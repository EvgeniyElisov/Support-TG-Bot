import Link from "next/link";

import { buildDashboardUrl } from "@/entities/message/lib/dashboard-url";
import type { DialogStatusFilter } from "@/entities/message/model/dialog-status";
import type { DialogAssigneeFilter } from "@/entities/message/model/dialog-assignee-filter";
import { formatMessageDate, getAvatarInitial, getDisplayName } from "../lib";
import type { ManagerDirectoryEntry, MessageDialogRecord } from "../model/types";

import { DialogAssignmentSelect } from "./dialog-assignment-select";
import { DialogStatusBadge } from "@/features/dialog-status";

type DialogClaim = {
  user_id: string;
  name: string;
  kind: "opened" | "release";
  at: string;
};

type DialogListProps = {
  dialogs: MessageDialogRecord[];
  selectedChatId: number | null;
  managers: ManagerDirectoryEntry[];
  sessionUserId: string | null;
  statusFilter: DialogStatusFilter;
  assigneeFilter: DialogAssigneeFilter;
  claimsByClientId?: Record<string, DialogClaim | undefined>;
};

export function DialogList({
  dialogs,
  selectedChatId,
  managers,
  sessionUserId,
  statusFilter,
  assigneeFilter,
  claimsByClientId,
}: DialogListProps) {
  if (dialogs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center text-sm text-zinc-500">
        Нет диалогов в этом списке.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {dialogs.map((dialog) => {
        const isActive = dialog.chat_id === selectedChatId;
        const initial = getAvatarInitial(dialog);
        const claim = claimsByClientId?.[dialog.client_id];
        const claimedByOther = claim && sessionUserId && claim.user_id !== sessionUserId;
        const href = buildDashboardUrl({
          chat: dialog.chat_id,
          page: 1,
          status: statusFilter,
          assignee: assigneeFilter,
        });

        const preview = (dialog.last_message_text ?? "").trim();

        return (
          <li key={dialog.chat_id}>
            <div
              className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                isActive
                  ? "border-[#c8ff3d]/45 bg-linear-to-br from-[#1a2610]/92 via-[#0f1418] to-[#0b0f16] shadow-[0_0_34px_-12px_rgba(200,255,61,0.45)]"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/7"
              }`}
            >
              <Link href={href} className="block p-3.5">
                <div className="flex gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${
                      isActive
                        ? "bg-linear-to-br from-[#c8ff3d]/30 to-[#2dd4bf]/18 text-[#f4ffe0] ring-1 ring-[#c8ff3d]/35"
                        : "bg-white/8 text-zinc-200 ring-1 ring-white/12"
                    }`}
                    aria-hidden
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`truncate text-[15px] font-bold leading-snug ${isActive ? "text-zinc-50" : "text-zinc-100"}`}>
                        {getDisplayName(dialog)}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <DialogStatusBadge status={dialog.dialog_status} />
                        {claimedByOther ? (
                          <span className="rounded-lg border border-[#2dd4bf]/25 bg-[#2dd4bf]/10 px-2 py-1 text-[11px] font-extrabold text-[#9af3e7]">
                            открыт: {claim.name}
                          </span>
                        ) : null}
                        <span
                          className={`rounded-lg border px-2 py-1 text-[11px] font-extrabold ${
                            isActive
                              ? "border-[#c8ff3d]/25 bg-[#c8ff3d]/10 text-[#e8ffc4]"
                              : "border-white/10 bg-white/6 text-zinc-300"
                          }`}
                        >
                          {dialog.messages_count}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      <p
                        className={`truncate text-[13px] leading-snug ${
                          isActive ? "text-zinc-200" : "text-zinc-300/90"
                        }`}
                      >
                        {preview.length > 0 ? preview : "—"}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500">
                        <span className={`${isActive ? "text-zinc-500" : "text-zinc-600"}`}>
                          {formatMessageDate(dialog.last_message_at)}
                        </span>
                        <span className="text-zinc-700">·</span>
                        <span className="truncate font-mono text-zinc-600">chat_id {dialog.chat_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              <div
                className={`border-t px-3.5 pb-3.5 pt-2 ${
                  isActive ? "border-[#c8ff3d]/15 bg-black/25" : "border-white/10 bg-black/15"
                }`}
              >
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
