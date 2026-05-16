"use client";

import { useActionState } from "react";

import {
  DIALOG_STATUSES,
  DIALOG_STATUS_LABELS,
  type DialogStatus,
} from "@/entities/message/model/dialog-status";
import { Spinner } from "@/shared/ui";

import {
  setClientDialogStatusAction,
  type SetDialogStatusState,
} from "../api/set-dialog-status";

type DialogStatusSelectProps = {
  clientId: string;
  value: DialogStatus;
  size?: "sm" | "md";
};

export function DialogStatusSelect({ clientId, value, size = "md" }: DialogStatusSelectProps) {
  const [state, formAction, isPending] = useActionState<SetDialogStatusState, FormData>(
    setClientDialogStatusAction,
    null,
  );

  const selectClass =
    size === "sm"
      ? "rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-[11px] text-zinc-100"
      : "w-full max-w-[220px] rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-zinc-100";

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input name="client_id" type="hidden" value={clientId} />
      <select
        key={`${clientId}-${value}`}
        name="dialog_status"
        defaultValue={value}
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
        }}
        disabled={isPending}
        aria-busy={isPending}
        className={`${selectClass} disabled:cursor-wait disabled:opacity-60`}
        aria-label="Статус диалога"
      >
        {DIALOG_STATUSES.map((s) => (
          <option key={s} value={s}>
            {DIALOG_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {isPending ? (
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <Spinner className="h-3 w-3" />
          Сохранение…
        </span>
      ) : null}
      {state?.error ? <span className="text-[11px] text-rose-400">{state.error}</span> : null}
    </form>
  );
}
