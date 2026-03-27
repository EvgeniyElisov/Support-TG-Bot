import type { MessageStatsRecord } from "../model/types";

type MessageStatsBarProps = {
  stats: MessageStatsRecord;
};

type StatCardProps = {
  label: string;
  value: number;
  accentClassName: string;
};

function StatCard({ label, value, accentClassName }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 p-4 shadow-lg shadow-black/25 backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${accentClassName}`}
        >
          {label}
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-zinc-100">{value.toLocaleString("ru-RU")}</p>
    </article>
  );
}

export function MessageStatsBar({ stats }: MessageStatsBarProps) {
  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2">
      <StatCard
        label="Сообщения"
        value={stats.total_messages}
        accentClassName="border-indigo-400/50 bg-indigo-500/20 text-indigo-100"
      />
      <StatCard
        label="Пользователи"
        value={stats.total_unique_users}
        accentClassName="border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
      />
    </section>
  );
}
