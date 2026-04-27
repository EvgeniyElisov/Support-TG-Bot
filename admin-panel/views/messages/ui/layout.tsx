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
import type { DialogAssigneeFilter } from "@/entities/message/model/dialog-assignee-filter";
import { ManagerReplyComposer } from "@/features/manager-reply";
import type { Database } from "@/types/supabase-database";

import { ConversationHeader } from "./conversation-header";
import { DialogStatusFilterBar } from "./dialog-status-filter";
import { DIALOGS_PER_PAGE } from "../model/constants";

type DialogClaimPayload = {
  client_id: string;
  kind: "opened" | "release";
  claimed_by: { user_id: string; name: string };
  at: string;
};

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
  assigneeFilter: DialogAssigneeFilter;
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
  assigneeFilter,
}: LayoutProps) {
  const router = useRouter();

  const [dialogsState, setDialogsState] = useState<MessageDialogRecord[]>(dialogs);
  const [activeDialogState, setActiveDialogState] = useState<MessageDialogRecord>(activeDialog);
  const [messagesState, setMessagesState] = useState<MessageRecord[]>(messages);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [dialogViewers, setDialogViewers] = useState<
    Array<{ user_id: string; first_name?: string | null; last_name?: string | null; company_role?: string | null }>
  >([]);
  const [typingByUserId, setTypingByUserId] = useState<Record<string, { name: string; expires_at: number }>>({});
  const [claimsByClientId, setClaimsByClientId] = useState<
    Record<string, { user_id: string; name: string; at: string; expires_at: number } | undefined>
  >({});
  const dialogsDashboardChannelRef = useRef<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null>(
    null,
  );

  const knownMessageIds = useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const activeDialogRef = useRef<MessageDialogRecord>(activeDialog);
  const dialogsByClientIdRef = useRef<Map<string, MessageDialogRecord>>(
    new Map(dialogs.map((d) => [d.client_id, d])),
  );

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

  useEffect(() => {
    activeDialogRef.current = activeDialogState;
  }, [activeDialogState]);

  useEffect(() => {
    dialogsByClientIdRef.current = new Map(dialogsState.map((d) => [d.client_id, d]));
  }, [dialogsState]);

  // Realtime: обновления сайдбара (dialogs) и новые сообщения в активном чате (messages).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    setDialogViewers([]);

    const matchesFilters = (dialog: MessageDialogRecord) => {
      if (statusFilter !== "all" && dialog.dialog_status !== statusFilter) return false;

      if (assigneeFilter === "all") return true;
      if (assigneeFilter === "unassigned") return dialog.current_manager_id == null;
      if (assigneeFilter === "mine") return sessionUserId != null && dialog.current_manager_id === sessionUserId;
      if (assigneeFilter === "others") {
        if (!dialog.current_manager_id) return false;
        return sessionUserId != null ? dialog.current_manager_id !== sessionUserId : true;
      }
      return true;
    };

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
      if (!matchesFilters(dialog)) {
        setDialogsState((prev) => prev.filter((d) => d.client_id !== dialog.client_id));
        return;
      }

      setDialogsState((prev) => {
        const without = prev.filter((d) => d.client_id !== dialog.client_id);
        return [dialog, ...without].slice(0, DIALOGS_PER_PAGE);
      });
    };

    const mergeDialogInList = (dialog: MessageDialogRecord) => {
      if (!matchesFilters(dialog)) {
        setDialogsState((prev) => prev.filter((d) => d.client_id !== dialog.client_id));
        return;
      }

      setDialogsState((prev) => {
        const idx = prev.findIndex((d) => d.client_id === dialog.client_id);
        if (idx === -1) return [dialog, ...prev].slice(0, DIALOGS_PER_PAGE);
        const next = [...prev];
        next[idx] = dialog;
        return next;
      });
    };

    const syncDialogEverywhere = (dialog: MessageDialogRecord) => {
      mergeDialogInList(dialog);
      setActiveDialogState((prev) => (prev.client_id === dialog.client_id ? dialog : prev));
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

    const assignmentsChannel = supabase
      .channel("client-assignments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_assignments" },
        (payload) => {
          const row =
            (payload.new as Database["public"]["Tables"]["client_assignments"]["Row"] | null) ??
            (payload.old as Database["public"]["Tables"]["client_assignments"]["Row"] | null);
          if (!row) return;
          const clientId = row.client_id;

          void fetchDialogByClientId(clientId).then((dialog) => {
            if (!dialog) return;
            syncDialogEverywhere(dialog);
          });
        },
      )
      .subscribe();

    const dialogStatesChannel = supabase
      .channel("client-dialog-states")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_dialog_states" },
        (payload) => {
          const row =
            (payload.new as Database["public"]["Tables"]["client_dialog_states"]["Row"] | null) ??
            (payload.old as Database["public"]["Tables"]["client_dialog_states"]["Row"] | null);
          if (!row) return;
          const clientId = row.client_id;

          void fetchDialogByClientId(clientId).then((dialog) => {
            if (!dialog) return;
            syncDialogEverywhere(dialog);
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
          if (row.client_id !== activeClientId) return;
          if (knownMessageIds.current.has(row.id)) return;
          knownMessageIds.current.add(row.id);

          if (currentPage !== 1) {
            setHasNewMessages(true);
            return;
          }

          const mgr =
            row.sent_by_manager_id != null ? managerById.get(row.sent_by_manager_id) : undefined;

          const dialogForMessage =
            activeDialogRef.current.client_id === row.client_id
              ? activeDialogRef.current
              : dialogsByClientIdRef.current.get(row.client_id) ?? null;
          if (!dialogForMessage) return;

          const record: MessageRecord = {
            id: row.id,
            created_at: row.created_at,
            text_content: row.text_content,
            direction: row.direction === "outbound" ? "outbound" : "inbound",
            delivered_at: row.delivered_at ?? null,
            read_at: row.read_at ?? null,
            failed_at: row.failed_at ?? null,
            send_error: row.send_error ?? null,
            manager_first_name: mgr?.first_name ?? null,
            manager_last_name: mgr?.last_name ?? null,
            manager_company_role: mgr?.company_role ?? null,
            chat_id: dialogForMessage.chat_id,
            username: dialogForMessage.username,
            first_name: dialogForMessage.first_name,
            last_name: dialogForMessage.last_name,
          };

          setMessagesState((prev) => [record, ...prev]);
        },
      )
      .subscribe();

    const messageUpdatesChannel = supabase
      .channel(`messages-updates-${activeClientId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `client_id=eq.${activeClientId}`,
        },
        (payload) => {
          const row = payload.new as Database["public"]["Tables"]["messages"]["Row"];
          setMessagesState((prev) => {
            const idx = prev.findIndex((m) => m.id === row.id);
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              delivered_at: row.delivered_at ?? next[idx].delivered_at,
              read_at: row.read_at ?? next[idx].read_at,
              failed_at: row.failed_at ?? next[idx].failed_at,
              send_error: row.send_error ?? next[idx].send_error,
            };
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(messageUpdatesChannel);
      supabase.removeChannel(dialogStatesChannel);
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(dialogsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDialog.client_id, currentPage, managerById, assigneeFilter, sessionUserId, statusFilter]);

  // Presence: кто смотрит активный диалог.
  useEffect(() => {
    if (!sessionUserId) {
      setDialogViewers([]);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const clientId = activeDialog.client_id;
    const self = managerById.get(sessionUserId);

    const presenceChannel = supabase.channel(`dialog:${clientId}`, {
      config: { presence: { key: sessionUserId } },
    });

    const syncFromPresenceState = () => {
      const state = presenceChannel.presenceState() as Record<string, Array<Record<string, unknown>>>;
      const list: Array<{
        user_id: string;
        first_name?: string | null;
        last_name?: string | null;
        company_role?: string | null;
      }> = [];

      for (const key of Object.keys(state)) {
        const metas = state[key] ?? [];
        for (const meta of metas) {
          const user_id = typeof meta.user_id === "string" ? meta.user_id : key;
          list.push({
            user_id,
            first_name: (meta.first_name as string | null | undefined) ?? null,
            last_name: (meta.last_name as string | null | undefined) ?? null,
            company_role: (meta.company_role as string | null | undefined) ?? null,
          });
        }
      }

      const byUser = new Map<string, (typeof list)[number]>();
      for (const v of list) byUser.set(v.user_id, v);
      setDialogViewers([...byUser.values()]);
    };

    presenceChannel
      .on("presence", { event: "sync" }, syncFromPresenceState)
      .on("presence", { event: "join" }, syncFromPresenceState)
      .on("presence", { event: "leave" }, syncFromPresenceState)
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await presenceChannel.track({
          user_id: sessionUserId,
          first_name: self?.first_name ?? null,
          last_name: self?.last_name ?? null,
          company_role: self?.company_role ?? null,
          at: new Date().toISOString(),
        });
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [activeDialog.client_id, managerById, sessionUserId]);

  // Broadcast: мягкая блокировка "кто открыл диалог" (эпhemeral, с TTL).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const TTL_MS = 90_000;

    const prune = () => {
      const now = Date.now();
      setClaimsByClientId((prev) => {
        let changed = false;
        const next: typeof prev = { ...prev };
        for (const [clientId, claim] of Object.entries(prev)) {
          if (!claim) continue;
          if (claim.expires_at <= now) {
            delete next[clientId];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    const interval = window.setInterval(prune, 5_000);

    const channel = supabase.channel("dialogs:dashboard");
    dialogsDashboardChannelRef.current = channel;

    channel
      .on("broadcast", { event: "dialog:claim" }, ({ payload }) => {
        const p = payload as Partial<DialogClaimPayload> | null;
        const clientId = typeof p?.client_id === "string" ? p.client_id : null;
        const kind = p?.kind;
        const claimedBy = p?.claimed_by;
        const at = typeof p?.at === "string" ? p.at : new Date().toISOString();

        if (!clientId || !claimedBy || typeof claimedBy.user_id !== "string") return;

        if (kind === "release") {
          setClaimsByClientId((prev) => {
            if (!prev[clientId]) return prev;
            const next = { ...prev };
            delete next[clientId];
            return next;
          });
          return;
        }

        if (kind === "opened") {
          setClaimsByClientId((prev) => ({
            ...prev,
            [clientId]: {
              user_id: claimedBy.user_id,
              name: typeof claimedBy.name === "string" ? claimedBy.name : claimedBy.user_id.slice(0, 8),
              at,
              expires_at: Date.now() + TTL_MS,
            },
          }));
        }
      });

    void channel.subscribe();

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
      if (dialogsDashboardChannelRef.current === channel) {
        dialogsDashboardChannelRef.current = null;
      }
    };
  }, []);

  // Broadcast: отправляем "opened" на активный диалог и "release" при уходе.
  useEffect(() => {
    if (!sessionUserId) return;

    const self = managerById.get(sessionUserId);
    const name =
      [self?.first_name, self?.last_name].filter(Boolean).join(" ") ||
      self?.company_role ||
      sessionUserId.slice(0, 8);

    const channel = dialogsDashboardChannelRef.current;
    if (!channel) return;
    const clientId = activeDialog.client_id;

    void channel.send({
      type: "broadcast",
      event: "dialog:claim",
      payload: {
        client_id: clientId,
        kind: "opened",
        claimed_by: { user_id: sessionUserId, name },
        at: new Date().toISOString(),
      } satisfies DialogClaimPayload,
    });

    return () => {
      void channel.send({
        type: "broadcast",
        event: "dialog:claim",
        payload: {
          client_id: clientId,
          kind: "release",
          claimed_by: { user_id: sessionUserId, name },
          at: new Date().toISOString(),
        } satisfies DialogClaimPayload,
      });
    };
  }, [activeDialog.client_id, managerById, sessionUserId]);

  // Broadcast: typing indicator в активном диалоге (эпhemeral, с TTL).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const clientId = activeDialog.client_id;
    const channelName = `dialog-events:${clientId}`;
    const TTL_MS = 6_000;

    setTypingByUserId({});

    const prune = () => {
      const now = Date.now();
      setTypingByUserId((prev) => {
        let changed = false;
        const next: typeof prev = { ...prev };
        for (const [userId, v] of Object.entries(prev)) {
          if (v.expires_at <= now) {
            delete next[userId];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    };

    const interval = window.setInterval(prune, 1_000);

    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "dialog:typing" }, ({ payload }) => {
        const p = payload as Partial<{
          user_id: string;
          name: string;
          is_typing: boolean;
        }> | null;
        if (!p || typeof p.user_id !== "string") return;
        if (sessionUserId && p.user_id === sessionUserId) return;

        if (p.is_typing === false) {
          setTypingByUserId((prev) => {
            if (!prev[p.user_id!]) return prev;
            const next = { ...prev };
            delete next[p.user_id!];
            return next;
          });
          return;
        }

        if (p.is_typing === true) {
          setTypingByUserId((prev) => ({
            ...prev,
            [p.user_id!]: {
              name: typeof p.name === "string" && p.name.length > 0 ? p.name : p.user_id!.slice(0, 8),
              expires_at: Date.now() + TTL_MS,
            },
          }));
        }
      })
      .subscribe();

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [activeDialog.client_id, sessionUserId]);

  return (
    <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-6 lg:items-stretch">
      <aside className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md lg:min-h-[min(720px,calc(100dvh-12rem))]">
        <div className="shrink-0 border-b border-white/10 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">Очередь</p>
          <p className="font-heading mt-0.5 text-sm font-semibold text-zinc-200">Диалоги</p>
        </div>
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <DialogStatusFilterBar
            active={statusFilter}
            assignee={assigneeFilter}
            selectedChatId={selectedChatId}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <DialogList
            dialogs={dialogsState}
            selectedChatId={selectedChatId}
            managers={managers}
            sessionUserId={sessionUserId}
            statusFilter={statusFilter}
            assigneeFilter={assigneeFilter}
            claimsByClientId={Object.fromEntries(
              Object.entries(claimsByClientId).map(([k, v]) => [
                k,
                v
                  ? { user_id: v.user_id, name: v.name, kind: "opened" as const, at: v.at }
                  : undefined,
              ]),
            )}
          />
        </div>
      </aside>

      <div className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md lg:min-h-[min(720px,calc(100dvh-12rem))]">
        <ConversationHeader
          dialog={activeDialogState}
          viewers={dialogViewers}
          sessionUserId={sessionUserId}
          claimedBy={
            claimsByClientId[activeDialogState.client_id]
              ? {
                  user_id: claimsByClientId[activeDialogState.client_id]!.user_id,
                  name: claimsByClientId[activeDialogState.client_id]!.name,
                }
              : null
          }
          typingLabel={
            Object.keys(typingByUserId).length > 0
              ? Object.values(typingByUserId)
                  .slice(0, 2)
                  .map((v) => v.name)
                  .join(", ")
              : null
          }
        />
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
                        assignee: assigneeFilter,
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
              <ManagerReplyComposer
                clientId={activeDialogState.client_id}
                sessionUserId={sessionUserId}
                managerName={
                  sessionUserId
                    ? ([managerById.get(sessionUserId)?.first_name, managerById.get(sessionUserId)?.last_name]
                        .filter(Boolean)
                        .join(" ") || sessionUserId.slice(0, 8))
                    : null
                }
              />
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
              assigneeFilter={assigneeFilter}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
