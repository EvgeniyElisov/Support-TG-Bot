import {
  DIALOG_STATUS_SHORT_LABELS,
  getDialogStatusBadgeClass,
  type DialogStatus,
} from "@/entities/message/model/dialog-status";

type DialogStatusBadgeProps = {
  status: DialogStatus;
  className?: string;
};

export function DialogStatusBadge({ status, className = "" }: DialogStatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${getDialogStatusBadgeClass(status)} ${className}`}
    >
      {DIALOG_STATUS_SHORT_LABELS[status]}
    </span>
  );
}
