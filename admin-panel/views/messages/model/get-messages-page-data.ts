import {
  getDialogsAndStats,
  getManagersDirectory,
  getMessagesByChatId,
} from "@/entities/message/api";
import { getSingleSearchParam, parsePositiveInteger } from "@/entities/message/lib";
import { createSupabaseServerClient } from "@/shared/api/supabase/server";

import { DIALOGS_PER_PAGE, MESSAGES_PER_PAGE } from "./constants";
import type { MessagesPageData } from "./types";

type SearchParamsInput = Promise<Record<string, string | string[] | undefined>> | undefined;

export async function getMessagesPageData(searchParams: SearchParamsInput): Promise<MessagesPageData> {
  const resolvedSearchParams = (await searchParams) ?? {};
  const chatParam = getSingleSearchParam(resolvedSearchParams.chat);
  const pageParam = getSingleSearchParam(resolvedSearchParams.page);

  const supabase = await createSupabaseServerClient();

  const [{ dialogs, stats }, managers, { data: userData }] = await Promise.all([
    getDialogsAndStats(DIALOGS_PER_PAGE),
    getManagersDirectory(),
    supabase.auth.getUser(),
  ]);

  const sessionUserId = userData.user?.id ?? null;

  const selectedChatFromQuery = parsePositiveInteger(chatParam);
  const selectedDialog =
    dialogs.find((dialog) => dialog.chat_id === selectedChatFromQuery) ?? dialogs[0] ?? null;

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

  return {
    stats,
    selectedDialog,
    messages,
    currentPage,
    totalPages,
    dialogs,
    managers,
    sessionUserId,
  };
}
