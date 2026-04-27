import {
  getDialogsAndStats,
  getManagersDirectory,
  getMessageDialogByChatId,
  getMessagesByChatId,
} from "@/entities/message/api";
import {
  buildDashboardUrl,
  getSingleSearchParam,
  parseDialogAssigneeFilter,
  parseDialogStatusFilter,
  parsePositiveInteger,
} from "@/entities/message/lib";
import { createSupabaseServerClient } from "@/shared/api/supabase/server";
import { redirect } from "next/navigation";

import { DIALOGS_PER_PAGE, MESSAGES_PER_PAGE } from "./constants";
import type { MessagesPageData } from "./types";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>> | undefined;

export async function getMessagesPageData(searchParams: SearchParamsInput): Promise<MessagesPageData> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const chatParam = getSingleSearchParam(resolvedSearchParams.chat);
  const pageParam = getSingleSearchParam(resolvedSearchParams.page);
  const statusParam = getSingleSearchParam(resolvedSearchParams.status);
  const assigneeParam = getSingleSearchParam(resolvedSearchParams.assignee);
  const statusFilter = parseDialogStatusFilter(statusParam);
  const assigneeFilter = parseDialogAssigneeFilter(assigneeParam);

  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  const sessionUserId = userData.user?.id ?? null;

  const [{ dialogs: dialogsRaw, stats }, managers] = await Promise.all([
    getDialogsAndStats(DIALOGS_PER_PAGE, statusFilter, assigneeFilter, sessionUserId),
    getManagersDirectory(),
  ]);

  const selectedChatFromQuery = parsePositiveInteger(chatParam);

  let selectedDialog =
    selectedChatFromQuery != null
      ? (dialogsRaw.find((d) => d.chat_id === selectedChatFromQuery) ?? null)
      : null;

  if (!selectedDialog && selectedChatFromQuery != null) {
    selectedDialog = await getMessageDialogByChatId(selectedChatFromQuery);
  }

  if (
    selectedDialog &&
    statusFilter !== "all" &&
    selectedDialog.dialog_status !== statusFilter
  ) {
    selectedDialog = null;
  }

  if (selectedDialog && assigneeFilter !== "all") {
    const assignedTo = selectedDialog.current_manager_id;
    const matches =
      assigneeFilter === "unassigned"
        ? assignedTo == null
        : assigneeFilter === "mine"
          ? sessionUserId != null && assignedTo === sessionUserId
          : assigneeFilter === "others"
            ? assignedTo != null && (sessionUserId ? assignedTo !== sessionUserId : true)
            : true;

    if (!matches) {
      selectedDialog = null;
    }
  }

  if (!selectedDialog) {
    selectedDialog = dialogsRaw[0] ?? null;
  }

  if (
    selectedDialog &&
    selectedChatFromQuery != null &&
    selectedDialog.chat_id !== selectedChatFromQuery
  ) {
    redirect(
      buildDashboardUrl({
        chat: selectedDialog.chat_id,
        status: statusFilter,
        assignee: assigneeFilter,
        page: 1,
      }),
    );
  }

  let dialogs = dialogsRaw;
  if (
    selectedDialog &&
    !dialogsRaw.some((d) => d.chat_id === selectedDialog!.chat_id)
  ) {
    dialogs = [selectedDialog, ...dialogsRaw];
  }

  if (!selectedDialog) {
    return {
      stats,
      selectedDialog: null,
      messages: [],
      currentPage: 1,
      totalPages: 1,
      dialogs,
      managers,
      sessionUserId,
      canReply: false as const,
      statusFilter,
      assigneeFilter,
    };
  }

  const requestedPage = parsePositiveInteger(pageParam) ?? 1;
  const totalPages = Math.max(1, Math.ceil(selectedDialog.messages_count / MESSAGES_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const { messages } = await getMessagesByChatId(
    selectedDialog.chat_id,
    currentPage,
    MESSAGES_PER_PAGE,
  );

  const canReply =
    sessionUserId !== null &&
    selectedDialog.current_manager_id !== null &&
    selectedDialog.current_manager_id === sessionUserId;

  return {
    stats,
    selectedDialog,
    messages,
    currentPage,
    totalPages,
    dialogs,
    managers,
    sessionUserId,
    canReply,
    statusFilter,
    assigneeFilter,
  };
}
