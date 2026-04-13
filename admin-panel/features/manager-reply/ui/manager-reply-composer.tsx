"use client";

import { useActionState, useEffect, useState } from "react";

import { sendManagerReplyAction, type SendManagerReplyState } from "../api/send-manager-reply";

type ManagerReplyComposerProps = {
  clientId: string;
};

export function ManagerReplyComposer({ clientId }: ManagerReplyComposerProps) {
  const [text, setText] = useState("");
  const [state, formAction, isPending] = useActionState<
    SendManagerReplyState,
    FormData
  >(sendManagerReplyAction, null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setText("");
    }
  }, [state]);

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
          onChange={(e) => setText(e.target.value)}
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
