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
  const supabase = await createSupabaseServerClient();

  const [{ data: dialogs, error: dialogsError }, { data: stats, error: statsError }] =
    await Promise.all([
      supabase
        .from("message_dialogs")
        .select(
          [
            "client_id",
            "chat_id",
            "username",
            "first_name",
            "last_name",
            "last_message_at",
            "messages_count",
            "current_manager_id",
            "assigned_by_manager_id",
            "current_manager_first_name",
            "current_manager_last_name",
            "assigned_by_manager_first_name",
            "assigned_by_manager_last_name",
          ].join(", "),
        )
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
    dialogs: (dialogs ?? []) as unknown as MessageDialogRecord[],
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

  const supabase = await createSupabaseServerClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, chat_id, username, first_name, last_name")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (!client) {
    return { messages: [] };
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, created_at, text_content")
    .eq("client_id", client.id)
    // Hide Telegram /start commands in admin history.
    .or("text_content.is.null,text_content.not.ilike./start%")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const clientFields = {
    chat_id: client.chat_id,
    username: client.username,
    first_name: client.first_name,
    last_name: client.last_name,
  };

  return {
    messages: (data ?? []).map((row) => ({
      ...row,
      ...clientFields,
    })) as MessageRecord[],
  };
}
