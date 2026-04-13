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

  return (
    <form
      action={formAction}
      className={`mt-2 border-t pt-2 ${borderTopClass}`}
      key={`${dialog.client_id}-${dialog.current_manager_id ?? ""}`}
    >
      <input type="hidden" name="client_id" value={dialog.client_id} />
      <label
        className={`mb-1 block text-[10px] font-medium uppercase tracking-wide ${labelMetaClass}`}
      >
        Ответственный
      </label>
      <select
        name="assigned_to"
        defaultValue={currentValue}
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
        }}
        className={`w-full rounded-lg border px-2 py-1.5 text-xs ${
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
        Последняя операция:{" "}
        {dialog.assigned_by_manager_id ? (
          <>
            {[dialog.assigned_by_manager_first_name, dialog.assigned_by_manager_last_name]
              .filter(Boolean)
              .join(" ") || "—"}
          </>
        ) : (
          "—"
        )}
      </div>
    </form>
  );
}
