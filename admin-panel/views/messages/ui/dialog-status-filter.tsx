import Link from "next/link";

import { buildDashboardUrl } from "@/entities/message/lib/dashboard-url";
import {
  DIALOG_STATUS_LABELS,
  type DialogStatusFilter,
} from "@/entities/message/model/dialog-status";
import {
  DIALOG_ASSIGNEE_FILTER_LABELS,
  type DialogAssigneeFilter,
} from "@/entities/message/model/dialog-assignee-filter";

const FILTER_ITEMS: { id: DialogStatusFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: DIALOG_STATUS_LABELS.new },
  { id: "in_progress", label: DIALOG_STATUS_LABELS.in_progress },
  { id: "waiting_client", label: DIALOG_STATUS_LABELS.waiting_client },
  { id: "closed", label: DIALOG_STATUS_LABELS.closed },
];

const ASSIGNEE_ITEMS: { id: DialogAssigneeFilter; label: string }[] = [
  { id: "all", label: DIALOG_ASSIGNEE_FILTER_LABELS.all },
  { id: "mine", label: DIALOG_ASSIGNEE_FILTER_LABELS.mine },
  { id: "unassigned", label: DIALOG_ASSIGNEE_FILTER_LABELS.unassigned },
  { id: "others", label: DIALOG_ASSIGNEE_FILTER_LABELS.others },
];

type DialogStatusFilterBarProps = {
  active: DialogStatusFilter;
  assignee: DialogAssigneeFilter;
  selectedChatId: number | null;
};

export function DialogStatusFilterBar({
  active,
  assignee,
  selectedChatId,
}: DialogStatusFilterBarProps) {
  return (
    <section className="mb-3 space-y-3" aria-label="Фильтры списка диалогов">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Статус</p>
        <div className="flex flex-wrap gap-2">
          {FILTER_ITEMS.map(({ id, label }) => {
            const href = buildDashboardUrl({
              status: id,
              assignee,
              chat: selectedChatId ?? undefined,
              page: 1,
            });
            const isActive = active === id;
            return (
              <Link
                key={id}
                href={href}
                className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${
                  isActive
                    ? "border-[#c8ff3d]/45 bg-[#c8ff3d]/12 text-[#e8ffc4]"
                    : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/8 hover:text-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Менеджер</p>
        <div className="flex flex-wrap gap-2">
          {ASSIGNEE_ITEMS.map(({ id, label }) => {
            const href = buildDashboardUrl({
              status: active,
              assignee: id,
              chat: selectedChatId ?? undefined,
              page: 1,
            });
            const isActive = assignee === id;
            return (
              <Link
                key={id}
                href={href}
                className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition ${
                  isActive
                    ? "border-[#2dd4bf]/45 bg-[#2dd4bf]/12 text-[#9af3e7]"
                    : "border-white/10 bg-black/20 text-zinc-300 hover:border-white/20 hover:bg-white/8 hover:text-zinc-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
