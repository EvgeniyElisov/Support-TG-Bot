import type { DialogStatus } from "./dialog-status";

export type MessageRecord = {
  id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  text_content: string | null;
  direction: "inbound" | "outbound";
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  send_error: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  manager_company_role: string | null;
};

export type MessageDialogRecord = {
  client_id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  dialog_status: DialogStatus;
  last_message_at: string;
  last_message_text: string | null;
  messages_count: number;
  current_manager_id: string | null;
  assigned_by_manager_id: string | null;
  current_manager_first_name: string | null;
  current_manager_last_name: string | null;
  assigned_by_manager_first_name: string | null;
  assigned_by_manager_last_name: string | null;
};

export type ManagerDirectoryEntry = {
  user_id: string;
  first_name: string;
  last_name: string;
  company_role: string;
};

export type MessageStatsRecord = {
  total_messages: number;
  total_unique_users: number;
};
