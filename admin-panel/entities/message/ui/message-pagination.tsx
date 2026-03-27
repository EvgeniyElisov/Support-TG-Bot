import Link from "next/link";

type MessagePaginationProps = {
  chatId: number;
  currentPage: number;
  totalPages: number;
};

export function MessagePagination({
  chatId,
  currentPage,
  totalPages,
}: MessagePaginationProps) {
  const prevPageHref = `/?chat=${chatId}&page=${Math.max(1, currentPage - 1)}`;
  const nextPageHref = `/?chat=${chatId}&page=${Math.min(totalPages, currentPage + 1)}`;

  return (
    <footer className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-700/60 bg-zinc-900/80 p-3 text-sm shadow-md shadow-black/20">
      <span className="text-zinc-400">
        Страница {currentPage} из {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={prevPageHref}
          aria-disabled={currentPage <= 1}
          className={`rounded-lg border px-3 py-1.5 font-medium transition ${
            currentPage <= 1
              ? "pointer-events-none border-zinc-700 text-zinc-600"
              : "border-zinc-600 text-zinc-200 hover:border-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Назад
        </Link>
        <Link
          href={nextPageHref}
          aria-disabled={currentPage >= totalPages}
          className={`rounded-lg border px-3 py-1.5 font-medium transition ${
            currentPage >= totalPages
              ? "pointer-events-none border-zinc-700 text-zinc-600"
              : "border-zinc-600 text-zinc-200 hover:border-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Вперед
        </Link>
      </div>
    </footer>
  );
}
