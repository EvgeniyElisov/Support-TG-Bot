import type { DialogStatusFilter } from "../model/dialog-status";
import type { DialogAssigneeFilter } from "../model/dialog-assignee-filter";
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

const DIALOG_SELECT_FIELDS = [
  "client_id",
  "chat_id",
  "username",
  "first_name",
  "last_name",
  "dialog_status",
  "last_message_at",
  "messages_count",
  "current_manager_id",
  "assigned_by_manager_id",
  "current_manager_first_name",
  "current_manager_last_name",
  "assigned_by_manager_first_name",
  "assigned_by_manager_last_name",
].join(", ");

function mapDialogRow(row: Record<string, unknown>): MessageDialogRecord {
  return row as unknown as MessageDialogRecord;
}

export async function getDialogsAndStats(
  limit: number,
  statusFilter: DialogStatusFilter = "all",
  assigneeFilter: DialogAssigneeFilter = "all",
  sessionUserId: string | null = null,
): Promise<DialogsAndStatsData> {
  const supabase = await createSupabaseServerClient();

  let dialogsQuery = supabase
    .from("message_dialogs")
    .select(DIALOG_SELECT_FIELDS)
    .order("last_message_at", { ascending: false })
    .limit(limit);

  if (statusFilter !== "all") {
    dialogsQuery = dialogsQuery.eq("dialog_status", statusFilter);
  }

  if (assigneeFilter === "mine") {
    if (sessionUserId) {
      dialogsQuery = dialogsQuery.eq("current_manager_id", sessionUserId);
    }
  } else if (assigneeFilter === "unassigned") {
    dialogsQuery = dialogsQuery.is("current_manager_id", null);
  } else if (assigneeFilter === "others") {
    dialogsQuery = dialogsQuery.not("current_manager_id", "is", null);
    if (sessionUserId) {
      dialogsQuery = dialogsQuery.neq("current_manager_id", sessionUserId);
    }
  }

  const [{ data: dialogs, error: dialogsError }, { data: stats, error: statsError }] =
    await Promise.all([
      dialogsQuery,
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
    dialogs: (dialogs ?? []).map((row) => mapDialogRow(row as unknown as Record<string, unknown>)),
    stats: stats as MessageStatsRecord,
  };
}

export async function getMessageDialogByChatId(
  chatId: number,
): Promise<MessageDialogRecord | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("message_dialogs")
    .select(DIALOG_SELECT_FIELDS)
    .eq("chat_id", chatId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapDialogRow(data as unknown as Record<string, unknown>);
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

  const { data: rows, error } = await supabase
    .from("messages")
    .select(
      "id, created_at, text_content, direction, sent_by_manager_id, delivered_at, read_at, failed_at, send_error",
    )
    .eq("client_id", client.id)
    .or(
      "direction.eq.outbound,and(direction.eq.inbound,or(text_content.is.null,text_content.not.ilike./start%))",
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const list = rows ?? [];
  const managerIds = [
    ...new Set(
      list.map((r) => r.sent_by_manager_id).filter((id): id is string => id !== null),
    ),
  ];

  let managerById = new Map<
    string,
    { first_name: string; last_name: string; company_role: string }
  >();

  if (managerIds.length > 0) {
    const { data: mgrs } = await supabase
      .from("managers")
      .select("user_id, first_name, last_name, company_role")
      .in("user_id", managerIds);

    managerById = new Map(
      (mgrs ?? []).map((m) => [
        m.user_id,
        {
          first_name: m.first_name,
          last_name: m.last_name,
          company_role: m.company_role,
        },
      ]),
    );
  }

  const clientFields = {
    chat_id: client.chat_id,
    username: client.username,
    first_name: client.first_name,
    last_name: client.last_name,
  };

  return {
    messages: list.map((row) => {
      const mgr = row.sent_by_manager_id
        ? managerById.get(row.sent_by_manager_id)
        : undefined;
      const direction = row.direction === "outbound" ? "outbound" : "inbound";

      return {
        id: row.id,
        created_at: row.created_at,
        text_content: row.text_content,
        direction,
        delivered_at: row.delivered_at ?? null,
        read_at: row.read_at ?? null,
        failed_at: row.failed_at ?? null,
        send_error: row.send_error ?? null,
        manager_first_name: mgr?.first_name ?? null,
        manager_last_name: mgr?.last_name ?? null,
        manager_company_role: mgr?.company_role ?? null,
        ...clientFields,
      } satisfies MessageRecord;
    }),
  };
}
