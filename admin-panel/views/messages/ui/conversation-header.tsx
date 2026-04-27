import { getAvatarInitial, getDisplayName } from "@/entities/message/lib";
import type { MessageDialogRecord } from "@/entities/message/model/types";
import { DialogStatusBadge, DialogStatusSelect } from "@/features/dialog-status";

type DialogViewer = {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  company_role?: string | null;
};

type ConversationHeaderProps = {
  dialog: MessageDialogRecord;
  viewers?: DialogViewer[];
  sessionUserId?: string | null;
  claimedBy?: { user_id: string; name: string } | null;
  typingLabel?: string | null;
};

export function ConversationHeader({
  dialog,
  viewers,
  sessionUserId,
  claimedBy,
  typingLabel,
}: ConversationHeaderProps) {
  const title = getDisplayName(dialog);
  const initial = getAvatarInitial(dialog);
  const otherViewers = (viewers ?? []).filter((v) => (sessionUserId ? v.user_id !== sessionUserId : true));

  const viewersLabel =
    otherViewers.length > 0
      ? otherViewers
          .map((v) => [v.first_name, v.last_name].filter(Boolean).join(" ") || v.user_id.slice(0, 8))
          .join(", ")
      : null;

  const hasSignals = Boolean(
    (claimedBy && sessionUserId && claimedBy.user_id !== sessionUserId) || viewersLabel || typingLabel,
  );

  return (
    <header className="shrink-0 border-b border-white/10 bg-black/15 px-5 py-4 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[#c8ff3d]/25 to-[#2dd4bf]/15 text-lg font-bold text-[#e8ffc4] ring-1 ring-white/10"
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Активный диалог
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading truncate text-lg font-bold leading-snug text-zinc-50 sm:text-xl">
                {title}
              </h2>
              <DialogStatusBadge status={dialog.dialog_status} className="hidden sm:inline-flex" />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                chat_id: {dialog.chat_id}
              </span>
              <span className="text-zinc-600">·</span>
              <span>{dialog.messages_count} сообщений</span>
            </div>

            {hasSignals ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {claimedBy && sessionUserId && claimedBy.user_id !== sessionUserId ? (
                  <span className="rounded-2xl border border-[#2dd4bf]/35 bg-[#2dd4bf]/12 px-3 py-1.5 text-[13px] font-extrabold text-[#9af3e7] shadow-[0_0_22px_-14px_rgba(45,212,191,0.9)]">
                    Открыт у {claimedBy.name}
                  </span>
                ) : null}
                {viewersLabel ? (
                  <span className="rounded-2xl border border-white/12 bg-white/7 px-3 py-1.5 text-[13px] font-semibold text-zinc-200 shadow-[0_0_20px_-16px_rgba(255,255,255,0.35)]">
                    Смотрят: <span className="font-bold text-zinc-100">{viewersLabel}</span>
                  </span>
                ) : null}
                {typingLabel ? (
                  <span className="rounded-2xl border border-[#c8ff3d]/35 bg-[#c8ff3d]/12 px-3 py-1.5 text-[13px] font-extrabold text-[#e8ffc4] shadow-[0_0_22px_-14px_rgba(200,255,61,0.9)]">
                    {typingLabel} печатает…
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="sm:hidden">
            <DialogStatusBadge status={dialog.dialog_status} />
          </div>
          <DialogStatusSelect clientId={dialog.client_id} value={dialog.dialog_status} />
        </div>
      </div>
    </header>
  );
}
