import type { MessageStatsRecord } from "@/entities/message/model/types";

import { MessageStatsBar } from "@/entities/message/ui";

type EmptyStateProps = {
  stats: MessageStatsRecord;
};

export function EmptyState({ stats }: EmptyStateProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/10 px-4 py-5 sm:px-6 lg:px-8">
        <MessageStatsBar stats={stats} />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-md text-center">
          <div
            className="pointer-events-none absolute -inset-8 -z-10 rounded-4xl bg-[radial-gradient(ellipse_at_center,rgba(200,255,61,0.08),transparent_65%)]"
            aria-hidden
          />
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ring-1 ring-white/5">
            <svg
              className="h-8 w-8 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.25}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-bold text-zinc-100">Пока нет диалогов</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Как только пользователи напишут боту, чаты появятся в колонке слева.
          </p>
        </div>
      </div>
    </div>
  );
}
