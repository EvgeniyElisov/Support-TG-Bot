"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/shared/api/supabase/browser";
import { sendManagerReplyAction, type SendManagerReplyState } from "../api/send-manager-reply";

type ManagerReplyComposerProps = {
  clientId: string;
  sessionUserId?: string | null;
  managerName?: string | null;
};

export function ManagerReplyComposer({
  clientId,
  sessionUserId,
  managerName,
}: ManagerReplyComposerProps) {
  const [text, setText] = useState("");
  const [state, formAction, isPending] = useActionState<
    SendManagerReplyState,
    FormData
  >(sendManagerReplyAction, null);

  const typingChannel = useMemo(() => `dialog-events:${clientId}`, [clientId]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createSupabaseBrowserClient>["channel"]> | null>(null);
  const isSubscribedRef = useRef(false);
  const isTypingRef = useRef(false);
  const lastTypingSentAt = useRef(0);
  const stopTimer = useRef<number | null>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setText("");
    }
  }, [state]);

  const sendTyping = (isTyping: boolean) => {
    if (!sessionUserId) return;
    const channel = channelRef.current;
    if (!channel || !isSubscribedRef.current) return;

    void channel.send({
      type: "broadcast",
      event: "dialog:typing",
      payload: {
        client_id: clientId,
        user_id: sessionUserId,
        name: managerName ?? sessionUserId.slice(0, 8),
        is_typing: isTyping,
        at: new Date().toISOString(),
      },
    });
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(typingChannel);
    channelRef.current = channel;
    isSubscribedRef.current = false;

    void channel.subscribe((status) => {
      isSubscribedRef.current = status === "SUBSCRIBED";
    });

    return () => {
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (isTypingRef.current) {
        sendTyping(false);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, sessionUserId, managerName]);

  return (
    <div className="border-t border-white/10 bg-black/20 px-1 py-4 sm:px-0">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Ответ клиенту в Telegram
      </p>
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input name="client_id" type="hidden" value={clientId} />
        <textarea
          name="reply_text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!sessionUserId) return;

            const now = Date.now();
            const shouldStart = !isTypingRef.current;
            const shouldPing = now - lastTypingSentAt.current > 1500;

            if (shouldStart || shouldPing) {
              isTypingRef.current = true;
              lastTypingSentAt.current = now;
              sendTyping(true);
            }

            if (stopTimer.current) window.clearTimeout(stopTimer.current);
            stopTimer.current = window.setTimeout(() => {
              if (!isTypingRef.current) return;
              isTypingRef.current = false;
              sendTyping(false);
            }, 4500);
          }}
          onBlur={() => {
            if (!isTypingRef.current) return;
            isTypingRef.current = false;
            sendTyping(false);
          }}
          rows={3}
          placeholder="Текст уйдёт пользователю с подписью менеджера…"
          disabled={isPending}
          className="min-h-[88px] w-full flex-1 resize-y rounded-xl border border-white/12 bg-black/35 px-3 py-2.5 text-sm text-zinc-100 shadow-inner outline-none transition placeholder:text-zinc-600 focus:border-[#c8ff3d]/45 focus:ring-2 focus:ring-[#c8ff3d]/15 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || text.trim().length === 0}
          className="font-heading shrink-0 rounded-xl bg-[#c8ff3d] px-5 py-3 text-sm font-bold tracking-wide text-black shadow-[0_0_28px_-8px_rgba(200,255,61,0.4)] transition hover:bg-[#d8ff6a] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Отправка…" : "Отправить"}
        </button>
      </form>
      {state && "error" in state ? (
        <p className="mt-2 text-xs text-rose-400">{state.error}</p>
      ) : null}
    </div>
  );
}
