import { MessageStatsBar } from "@/entities/message/ui";

import type { MessagesPageData } from "../model/types";
import { EmptyState } from "./empty-state";
import { Layout } from "./layout";

type ViewProps = {
  data: MessagesPageData;
};

export function View({ data }: ViewProps) {
  if (!data.selectedDialog) {
    return <EmptyState stats={data.stats} statusFilter={data.statusFilter} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/10 px-4 py-5 sm:px-6 lg:px-8">
        <MessageStatsBar stats={data.stats} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8">
        <Layout
          dialogs={data.dialogs}
          selectedChatId={data.selectedDialog.chat_id}
          activeDialog={data.selectedDialog}
          messages={data.messages}
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          managers={data.managers}
          sessionUserId={data.sessionUserId}
          canReply={data.canReply}
          statusFilter={data.statusFilter}
        />
      </div>
    </div>
  );
}
