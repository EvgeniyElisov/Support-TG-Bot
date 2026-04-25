"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/shared/api/supabase/browser";
import { buildDashboardUrl } from "@/entities/message/lib/dashboard-url";
import {
  DialogList,
  MessageList,
  MessagePagination,
} from "@/entities/message/ui";
import type {
  ManagerDirectoryEntry,
  MessageDialogRecord,
  MessageRecord,
} from "@/entities/message/model/types";
import type { DialogStatusFilter } from "@/entities/message/model/dialog-status";
import { ManagerReplyComposer } from "@/features/manager-reply";
import type { Database } from "@/types/supabase-database";

import { ConversationHeader } from "./conversation-header";
import { DialogStatusFilterBar } from "./dialog-status-filter";
import { DIALOGS_PER_PAGE } from "../model/constants";

type LayoutProps = {
  dialogs: MessageDialogRecord[];
  selectedChatId: number;
  activeDialog: MessageDialogRecord;
  messages: MessageRecord[];
  currentPage: number;
  totalPages: number;
  managers: ManagerDirectoryEntry[];
  sessionUserId: string | null;
  canReply: boolean;
  statusFilter: DialogStatusFilter;
};

export function Layout({
  dialogs,
  selectedChatId,
  activeDialog,
  messages,
  currentPage,
  totalPages,
  managers,
  sessionUserId,
  canReply,
  statusFilter,
}: LayoutProps) {
  const router = useRouter();

  const [dialogsState, setDialogsState] = useState<MessageDialogRecord[]>(dialogs);
  const [activeDialogState, setActiveDialogState] = useState<MessageDialogRecord>(activeDialog);
  const [messagesState, setMessagesState] = useState<MessageRecord[]>(messages);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const knownMessageIds = useRef<Set<string>>(new Set(messages.map((m) => m.id)));

  const managerById = useMemo(() => {
    return new Map(
      managers.map((m) => [
        m.user_id,
        { first_name: m.first_name, last_name: m.last_name, company_role: m.company_role },
      ]),
    );
  }, [managers]);

  // Синхронизация состояния при навигации (смена чата/фильтра/страницы).
  useEffect(() => {
    setDialogsState(dialogs);
  }, [dialogs]);

  useEffect(() => {
    setActiveDialogState(activeDialog);
  }, [activeDialog]);

  useEffect(() => {
    setMessagesState(messages);
    knownMessageIds.current = new Set(messages.map((m) => m.id));
    setHasNewMessages(false);
  }, [messages, activeDialog.client_id]);

  // Realtime: обновления сайдбара (dialogs) и новые сообщения в активном чате (messages).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const fetchDialogByClientId = async (clientId: string) => {
      const { data, error } = await supabase
        .from("message_dialogs")
        .select(
          [
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
          ].join(", "),
        )
        .eq("client_id", clientId)
        .maybeSingle();

      if (error || !data) return null;
      return data as unknown as MessageDialogRecord;
    };

    const upsertDialogToTop = (dialog: MessageDialogRecord) => {
      if (statusFilter !== "all" && dialog.dialog_status !== statusFilter) {
        setDialogsState((prev) => prev.filter((d) => d.client_id !== dialog.client_id));
        return;
      }

      setDialogsState((prev) => {
        const without = prev.filter((d) => d.client_id !== dialog.client_id);
        return [dialog, ...without].slice(0, DIALOGS_PER_PAGE);
      });
    };

    const dialogsChannel = supabase
      .channel("dialogs-sidebar")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "dialogs" },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["dialogs"]["Row"];
          const clientId = row.client_id;
          const lastMessageAt = row.last_message_at;
          const messagesCount = row.messages_count;

          setDialogsState((prev) => {
            const idx = prev.findIndex((d) => d.client_id === clientId);
            if (idx === -1) {
              void fetchDialogByClientId(clientId).then((dialog) => {
                if (!dialog) return;
                upsertDialogToTop(dialog);
              });
              return prev;
            }
            const next = [...prev];
            const updated: MessageDialogRecord = {
              ...next[idx],
              last_message_at: lastMessageAt ?? next[idx].last_message_at,
              messages_count: messagesCount,
            };
            next.splice(idx, 1);
            return [updated, ...next];
          });

          setActiveDialogState((prev) => {
            if (prev.client_id !== clientId) return prev;
            return {
              ...prev,
              last_message_at: lastMessageAt ?? prev.last_message_at,
              messages_count: messagesCount,
            };
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dialogs" },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["dialogs"]["Row"];
          const clientId = row.client_id;

          void fetchDialogByClientId(clientId).then((dialog) => {
            if (!dialog) return;
            upsertDialogToTop(dialog);
          });
        },
      )
      .subscribe();

    const activeClientId = activeDialog.client_id;
    const messagesChannel = supabase
      .channel(`messages-active-${activeClientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `client_id=eq.${activeClientId}`,
        },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["messages"]["Row"];
          if (knownMessageIds.current.has(row.id)) return;
          knownMessageIds.current.add(row.id);

          if (currentPage !== 1) {
            setHasNewMessages(true);
            return;
          }

          const mgr =
            row.sent_by_manager_id != null ? managerById.get(row.sent_by_manager_id) : undefined;

          const record: MessageRecord = {
            id: row.id,
            created_at: row.created_at,
            text_content: row.text_content,
            direction: row.direction === "outbound" ? "outbound" : "inbound",
            manager_first_name: mgr?.first_name ?? null,
            manager_last_name: mgr?.last_name ?? null,
            manager_company_role: mgr?.company_role ?? null,
            chat_id: activeDialogState.chat_id,
            username: activeDialogState.username,
            first_name: activeDialogState.first_name,
            last_name: activeDialogState.last_name,
          };

          setMessagesState((prev) => [record, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(dialogsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDialog.client_id, currentPage, managerById]);

  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-6 lg:items-stretch">
      <aside className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md lg:min-h-[min(720px,calc(100dvh-12rem))]">
        <div className="shrink-0 border-b border-white/10 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">Очередь</p>
          <p className="font-heading mt-0.5 text-sm font-semibold text-zinc-200">Диалоги</p>
        </div>
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <DialogStatusFilterBar active={statusFilter} selectedChatId={selectedChatId} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <DialogList
            dialogs={dialogsState}
            selectedChatId={selectedChatId}
            managers={managers}
            sessionUserId={sessionUserId}
            statusFilter={statusFilter}
          />
        </div>
      </aside>

      <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md lg:min-h-[min(720px,calc(100dvh-12rem))]">
        <ConversationHeader dialog={activeDialogState} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
            {hasNewMessages ? (
              <div className="mb-4 rounded-xl border border-[#c8ff3d]/25 bg-[#c8ff3d]/8 px-4 py-3 text-sm text-[#e8ffc4]">
                Появились новые сообщения.
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      buildDashboardUrl({
                        chat: activeDialogState.chat_id,
                        page: 1,
                        status: statusFilter,
                      }),
                    );
                  }}
                  className="ml-3 rounded-lg bg-[#c8ff3d] px-3 py-1.5 text-xs font-bold text-black hover:bg-[#d8ff6a]"
                >
                  Перейти к новым
                </button>
              </div>
            ) : null}
            <MessageList messages={messagesState} />
          </div>
          {canReply ? (
            <div className="shrink-0 px-3 sm:px-5">
              <ManagerReplyComposer clientId={activeDialogState.client_id} />
            </div>
          ) : (
            <div className="shrink-0 border-t border-white/10 px-3 py-3 text-xs leading-relaxed text-zinc-500 sm:px-5">
              {activeDialogState.current_manager_id == null
                ? "Чтобы писать клиенту, назначьте ответственного менеджера в блоке под диалогом слева."
                : "Отвечать в Telegram может только менеджер, назначенный на этот диалог."}
            </div>
          )}
          <div className="shrink-0 border-t border-white/10 px-3 py-3 sm:px-5">
            <MessagePagination
              chatId={selectedChatId}
              currentPage={currentPage}
              totalPages={totalPages}
              statusFilter={statusFilter}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
