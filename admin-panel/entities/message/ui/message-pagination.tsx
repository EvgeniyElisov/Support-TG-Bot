import Link from "next/link";

import { buildDashboardUrl } from "@/entities/message/lib/dashboard-url";
import type { DialogStatusFilter } from "@/entities/message/model/dialog-status";
import type { DialogAssigneeFilter } from "@/entities/message/model/dialog-assignee-filter";

type MessagePaginationProps = {
  chatId: number;
  currentPage: number;
  totalPages: number;
  statusFilter: DialogStatusFilter;
  assigneeFilter: DialogAssigneeFilter;
};

export function MessagePagination({
  chatId,
  currentPage,
  totalPages,
  statusFilter,
  assigneeFilter,
}: MessagePaginationProps) {
  const prevPageHref = buildDashboardUrl({
    chat: chatId,
    page: Math.max(1, currentPage - 1),
    status: statusFilter,
    assignee: assigneeFilter,
  });
  const nextPageHref = buildDashboardUrl({
    chat: chatId,
    page: Math.min(totalPages, currentPage + 1),
    status: statusFilter,
    assignee: assigneeFilter,
  });

  return (
    <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-zinc-500">
        Страница <span className="font-semibold text-zinc-400">{currentPage}</span> из{" "}
        <span className="font-semibold text-zinc-400">{totalPages}</span>
      </span>
      <div className="flex gap-2">
        <Link
          href={prevPageHref}
          aria-disabled={currentPage <= 1}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            currentPage <= 1
              ? "pointer-events-none text-zinc-600"
              : "border border-white/15 text-zinc-200 hover:border-[#c8ff3d]/40 hover:bg-[#c8ff3d]/10 hover:text-[#e8ffc4]"
          }`}
        >
          Назад
        </Link>
        <Link
          href={nextPageHref}
          aria-disabled={currentPage >= totalPages}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            currentPage >= totalPages
              ? "pointer-events-none text-zinc-600"
              : "border border-white/15 text-zinc-200 hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/10 hover:text-teal-100"
          }`}
        >
          Вперёд
        </Link>
      </div>
    </footer>
  );
}
