import { MessageStatsBar } from "@/entities/message/ui";

import type { MessagesPageData } from "../model/types";
import { EmptyState } from "./empty-state";
import { Header } from "./header";
import { Layout } from "./layout";

type ViewProps = {
  data: MessagesPageData;
};

export function View({ data }: ViewProps) {
  if (!data.selectedDialog) {
    return <EmptyState stats={data.stats} />;
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Header
          title="@hug_the_bug_bot — Сообщения"
          subtitle="Панель сообщений Telegram-бота"
        />
        <MessageStatsBar stats={data.stats} />

        <Layout
          dialogs={data.dialogs}
          selectedChatId={data.selectedDialog.chat_id}
          messages={data.messages}
          currentPage={data.currentPage}
          totalPages={data.totalPages}
        />
      </main>
    </div>
  );
}
