import type {
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
    }
  | {
      stats: MessageStatsRecord;
      selectedDialog: MessageDialogRecord;
      messages: MessageRecord[];
      currentPage: number;
      totalPages: number;
      dialogs: MessageDialogRecord[];
    };
