import type { MessageStatsRecord } from "../model/types";

type MessageStatsBarProps = {
  stats: MessageStatsRecord;
};

export function MessageStatsBar({ stats }: MessageStatsBarProps) {
  return (
    <section
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Сводка"
    >
      <div>
        <p className="font-heading text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          Входящие
        </p>
        <p className="mt-1 max-w-xl text-sm text-zinc-500">
          Сообщения Telegram-бота и назначение ответственных по диалогам.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 sm:justify-end">
        <div className="flex min-w-[140px] items-baseline gap-3 rounded-2xl border border-[#c8ff3d]/25 bg-[#c8ff3d]/6 px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#b8d65a]">
            Сообщения
          </span>
          <span className="font-heading text-2xl font-bold tabular-nums text-zinc-50">
            {stats.total_messages.toLocaleString("ru-RU")}
          </span>
        </div>
        <div className="flex min-w-[140px] items-baseline gap-3 rounded-2xl border border-[#2dd4bf]/30 bg-[#2dd4bf]/8 px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300/90">
            Пользователи
          </span>
          <span className="font-heading text-2xl font-bold tabular-nums text-zinc-50">
            {stats.total_unique_users.toLocaleString("ru-RU")}
          </span>
        </div>
      </div>
    </section>
  );
}
