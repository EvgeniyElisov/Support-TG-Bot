export const DIALOG_STATUSES = ["new", "in_progress", "waiting_client", "closed"] as const;

export type DialogStatus = (typeof DIALOG_STATUSES)[number];

export type DialogStatusFilter = DialogStatus | "all";

export const DIALOG_STATUS_LABELS: Record<DialogStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  waiting_client: "Ждём клиента",
  closed: "Закрыт",
};

/** Короткие подписи для узких бейджей */
export const DIALOG_STATUS_SHORT_LABELS: Record<DialogStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  waiting_client: "Ждём",
  closed: "Закрыт",
};

export function getDialogStatusBadgeClass(status: DialogStatus): string {
  switch (status) {
    case "new":
      return "border-sky-400/40 bg-sky-500/15 text-sky-200";
    case "in_progress":
      return "border-[#c8ff3d]/45 bg-[#c8ff3d]/12 text-[#e8ffc4]";
    case "waiting_client":
      return "border-amber-400/45 bg-amber-500/15 text-amber-100";
    case "closed":
      return "border-zinc-500/50 bg-zinc-600/25 text-zinc-300";
    default: {
      const _x: never = status;
      return _x;
    }
  }
}
