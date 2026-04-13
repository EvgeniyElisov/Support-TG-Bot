import {
  DialogList,
  MessageList,
  MessagePagination,
} from "@/entities/message/ui";
import type {
  ManagerDirectoryEntry,
  MessageDialogRecord,
  MessageRecord,
} from "@/entities/message/model/types";
import type { DialogStatusFilter } from "@/entities/message/model/dialog-status";
import { ManagerReplyComposer } from "@/features/manager-reply";

import { ConversationHeader } from "./conversation-header";
import { DialogStatusFilterBar } from "./dialog-status-filter";

type LayoutProps = {
  dialogs: MessageDialogRecord[];
  selectedChatId: number;
  activeDialog: MessageDialogRecord;
  messages: MessageRecord[];
  currentPage: number;
  totalPages: number;
  managers: ManagerDirectoryEntry[];
  sessionUserId: string | null;
  canReply: boolean;
  statusFilter: DialogStatusFilter;
};

export function Layout({
  dialogs,
  selectedChatId,
  activeDialog,
  messages,
  currentPage,
  totalPages,
  managers,
  sessionUserId,
  canReply,
  statusFilter,
}: LayoutProps) {
  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-6 lg:items-stretch">
      <aside className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md lg:min-h-[min(720px,calc(100dvh-12rem))]">
        <div className="shrink-0 border-b border-white/10 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">Очередь</p>
          <p className="font-heading mt-0.5 text-sm font-semibold text-zinc-200">Диалоги</p>
        </div>
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <DialogStatusFilterBar active={statusFilter} selectedChatId={selectedChatId} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <DialogList
            dialogs={dialogs}
            selectedChatId={selectedChatId}
            managers={managers}
            sessionUserId={sessionUserId}
            statusFilter={statusFilter}
          />
        </div>
      </aside>

      <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md lg:min-h-[min(720px,calc(100dvh-12rem))]">
        <ConversationHeader dialog={activeDialog} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            <MessageList messages={messages} />
          </div>
          {canReply ? (
            <div className="shrink-0 px-3 sm:px-5">
              <ManagerReplyComposer clientId={activeDialog.client_id} />
            </div>
          ) : (
            <div className="shrink-0 border-t border-white/10 px-3 py-3 text-xs leading-relaxed text-zinc-500 sm:px-5">
              {activeDialog.current_manager_id == null
                ? "Чтобы писать клиенту, назначьте ответственного менеджера в блоке под диалогом слева."
                : "Отвечать в Telegram может только менеджер, назначенный на этот диалог."}
            </div>
          )}
          <div className="shrink-0 border-t border-white/10 px-3 py-3 sm:px-5">
            <MessagePagination
              chatId={selectedChatId}
              currentPage={currentPage}
              totalPages={totalPages}
              statusFilter={statusFilter}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
