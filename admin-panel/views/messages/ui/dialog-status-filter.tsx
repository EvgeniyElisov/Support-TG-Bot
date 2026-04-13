import Link from "next/link";

import { buildDashboardUrl } from "@/entities/message/lib/dashboard-url";
import {
  DIALOG_STATUS_LABELS,
  type DialogStatus,
  type DialogStatusFilter,
} from "@/entities/message/model/dialog-status";

const FILTER_ITEMS: { id: DialogStatusFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: DIALOG_STATUS_LABELS.new },
  { id: "in_progress", label: DIALOG_STATUS_LABELS.in_progress },
  { id: "waiting_client", label: DIALOG_STATUS_LABELS.waiting_client },
  { id: "closed", label: DIALOG_STATUS_LABELS.closed },
];

type DialogStatusFilterBarProps = {
  active: DialogStatusFilter;
  selectedChatId: number | null;
};

export function DialogStatusFilterBar({ active, selectedChatId }: DialogStatusFilterBarProps) {
  return (
    <section className="mb-3" aria-label="Фильтр по статусу диалога">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Статус</p>
      <div className="flex flex-wrap gap-1.5">
        {FILTER_ITEMS.map(({ id, label }) => {
          const href = buildDashboardUrl({
            status: id,
            chat: selectedChatId ?? undefined,
            page: 1,
          });
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href}
              className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                isActive
                  ? "border-[#c8ff3d]/45 bg-[#c8ff3d]/12 text-[#e8ffc4]"
                  : "border-white/10 bg-black/20 text-zinc-400 hover:border-white/20 hover:bg-white/8 hover:text-zinc-200"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
