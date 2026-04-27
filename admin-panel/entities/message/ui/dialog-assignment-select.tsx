"use client";

import { useActionState } from "react";

import { setClientAssignmentAction } from "@/features/client-assignment/api/set-client-assignment";

import type { ManagerDirectoryEntry, MessageDialogRecord } from "../model/types";

type DialogAssignmentSelectProps = {
  dialog: MessageDialogRecord;
  managers: ManagerDirectoryEntry[];
  sessionUserId: string | null;
  /** Активная карточка диалога — светлый текст на градиенте */
  isActive?: boolean;
};

function formatManagerLabel(m: ManagerDirectoryEntry, sessionUserId: string | null): string {
  const name = [m.first_name, m.last_name].filter(Boolean).join(" ");
  const suffix = sessionUserId && m.user_id === sessionUserId ? " (я)" : "";
  return `${name}${suffix} — ${m.company_role}`;
}

export function DialogAssignmentSelect({
  dialog,
  managers,
  sessionUserId,
  isActive = false,
}: DialogAssignmentSelectProps) {
  const [state, formAction] = useActionState(setClientAssignmentAction, null);
  const currentValue = dialog.current_manager_id ?? "";
  const orphanAssigned =
    currentValue &&
    !managers.some((m) => m.user_id === currentValue);

  const labelMetaClass = isActive ? "text-[#e8ffc4]/95" : "text-zinc-500";
  const borderTopClass = isActive ? "border-[#c8ff3d]/20" : "border-white/10";
  const currentManagerLabel = dialog.current_manager_id
    ? ([dialog.current_manager_first_name, dialog.current_manager_last_name].filter(Boolean).join(" ") || "Назначен")
    : "Не назначен";
  const currentManagerPillClass = dialog.current_manager_id
    ? (sessionUserId && dialog.current_manager_id === sessionUserId
        ? "border-[#c8ff3d]/35 bg-[#c8ff3d]/12 text-[#e8ffc4]"
        : "border-[#2dd4bf]/30 bg-[#2dd4bf]/10 text-[#9af3e7]")
    : "border-white/12 bg-white/6 text-zinc-300";

  return (
    <form
      action={formAction}
      className={`mt-2 border-t pt-2 ${borderTopClass}`}
      key={`${dialog.client_id}-${dialog.current_manager_id ?? ""}`}
    >
      <input type="hidden" name="client_id" value={dialog.client_id} />
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className={`block text-[10px] font-bold uppercase tracking-[0.2em] ${labelMetaClass}`}>
          Ответственный
        </label>
        <span className={`rounded-xl border px-2 py-1 text-[11px] font-extrabold ${currentManagerPillClass}`}>
          {currentManagerLabel}
        </span>
      </div>
      <select
        name="assigned_to"
        defaultValue={currentValue}
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
        }}
        className={`w-full rounded-xl border px-3 py-2 text-[13px] font-semibold ${
          isActive
            ? "border-[#c8ff3d]/35 bg-black/60 text-zinc-100"
            : "border-white/15 bg-black/40 text-zinc-100"
        }`}
      >
        <option value="">Не назначен</option>
        {orphanAssigned ? (
          <option value={currentValue}>
            Текущий (нет в справочнике)
          </option>
        ) : null}
        {managers.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {formatManagerLabel(m, sessionUserId)}
          </option>
        ))}
      </select>
      {state?.error ? (
        <p
          className={`mt-1 text-xs ${isActive ? "text-rose-200" : "text-rose-400/90"}`}
        >
          {state.error}
        </p>
      ) : null}
      <div className={`mt-1 text-[10px] leading-snug ${labelMetaClass}`}>
        Кто последним менял ответственного:{" "}
        {dialog.assigned_by_manager_id ? (
          <>
            {[dialog.assigned_by_manager_first_name, dialog.assigned_by_manager_last_name]
              .filter(Boolean)
              .join(" ") || "—"}
          </>
        ) : (
          "ещё не меняли"
        )}
      </div>
    </form>
  );
}
