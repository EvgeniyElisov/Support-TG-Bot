import type {
  MessageDialogRecord,
  MessageRecord,
  MessageStatsRecord,
} from "../model/types";
import { createSupabaseServerClient } from "@/shared/api/supabase/server";

type DialogsAndStatsData = {
  dialogs: MessageDialogRecord[];
  stats: MessageStatsRecord;
};

type MessagePageData = {
  messages: MessageRecord[];
};

export async function getDialogsAndStats(limit: number): Promise<DialogsAndStatsData> {
  const supabase = createSupabaseServerClient();

  const [{ data: dialogs, error: dialogsError }, { data: stats, error: statsError }] =
    await Promise.all([
      supabase
        .from("message_dialogs")
        .select("chat_id, username, first_name, last_name, last_message_at, messages_count")
        .order("last_message_at", { ascending: false })
        .limit(limit),
      supabase
        .from("message_stats")
        .select("total_messages, total_unique_users")
        .single(),
    ]);

  if (dialogsError) {
    throw new Error(dialogsError.message);
  }

  if (statsError) {
    throw new Error(statsError.message);
  }

  return {
    dialogs: (dialogs ?? []) as MessageDialogRecord[],
    stats: stats as MessageStatsRecord,
  };
}

export async function getMessagesByChatId(
  chatId: number,
  page: number,
  pageSize: number,
): Promise<MessagePageData> {
  if (!Number.isFinite(chatId)) {
    return { messages: [] };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, chat_id, username, first_name, last_name, created_at, text_content, caption")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    messages: (data ?? []) as MessageRecord[],
  };
}
