import type { MessageStatsRecord } from "@/entities/message/model/types";

type EmptyStateProps = {
  stats: MessageStatsRecord;
};

export function EmptyState({ stats }: EmptyStateProps) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900">
          @hug_the_bug_bot — Сообщения
        </h1>
        <p className="mb-8 text-sm text-zinc-600">
          Всего сообщений: {stats.total_messages}. Уникальных пользователей:{" "}
          {stats.total_unique_users}.
        </p>
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/75 p-6 text-sm text-zinc-300 shadow-xl backdrop-blur-xl">
          Диалогов пока нет.
        </div>
      </main>
    </div>
  );
}
