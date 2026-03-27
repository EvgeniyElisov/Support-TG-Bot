import {
  DialogList,
  MessageList,
  MessagePagination,
} from "@/entities/message/ui";
import type { MessageDialogRecord, MessageRecord } from "@/entities/message/model/types";

type LayoutProps = {
  dialogs: MessageDialogRecord[];
  selectedChatId: number;
  messages: MessageRecord[];
  currentPage: number;
  totalPages: number;
};

export function Layout({
  dialogs,
  selectedChatId,
  messages,
  currentPage,
  totalPages,
}: LayoutProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <aside className="rounded-2xl border border-zinc-700/50 bg-zinc-900/70 p-4 shadow-xl backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Диалоги</h2>
        <DialogList dialogs={dialogs} selectedChatId={selectedChatId} />
      </aside>

      <div className="rounded-2xl border border-zinc-700/50 bg-zinc-900/70 p-4 shadow-xl backdrop-blur-xl">
        <MessageList messages={messages} />

        <MessagePagination
          chatId={selectedChatId}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </section>
  );
}
