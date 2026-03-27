export type MessageRecord = {
  id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  text_content: string | null;
  caption: string | null;
};

export type MessageDialogRecord = {
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  last_message_at: string;
  messages_count: number;
};

export type MessageStatsRecord = {
  total_messages: number;
  total_unique_users: number;
};
