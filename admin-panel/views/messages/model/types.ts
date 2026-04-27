import type { DialogStatusFilter } from "@/entities/message/model/dialog-status";
import type { DialogAssigneeFilter } from "@/entities/message/model/dialog-assignee-filter";
import type {
  ManagerDirectoryEntry,
  MessageDialogRecord,
  MessageRecord,
  MessageStatsRecord,
} from "@/entities/message/model/types";

export type MessagesPageData =
  | {
      stats: MessageStatsRecord;
      selectedDialog: null;
      messages: MessageRecord[];
      currentPage: 1;
      totalPages: 1;
      dialogs: MessageDialogRecord[];
      managers: ManagerDirectoryEntry[];
      sessionUserId: string | null;
      canReply: false;
      statusFilter: DialogStatusFilter;
      assigneeFilter: DialogAssigneeFilter;
    }
  | {
      stats: MessageStatsRecord;
      selectedDialog: MessageDialogRecord;
      messages: MessageRecord[];
      currentPage: number;
      totalPages: number;
      dialogs: MessageDialogRecord[];
      managers: ManagerDirectoryEntry[];
      sessionUserId: string | null;
      canReply: boolean;
      statusFilter: DialogStatusFilter;
      assigneeFilter: DialogAssigneeFilter;
    };
