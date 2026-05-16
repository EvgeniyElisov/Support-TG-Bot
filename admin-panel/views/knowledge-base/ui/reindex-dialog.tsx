"use client";

import { AppDialog } from "@/shared/ui";

export type ReindexDialogState =
  | { type: "confirm" }
  | {
      type: "success";
      documents: number;
      chunks: number;
      embeddingsProvider?: string;
    }
  | { type: "error"; message: string };

type ReindexDialogProps = {
  state: ReindexDialogState | null;
  publishedCount: number;
  onClose: () => void;
  onConfirm: () => void;
};

const secondaryButtonClass =
  "w-full rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-bold text-zinc-200 hover:border-white/15 hover:bg-white/6 sm:w-auto";

const primaryButtonClass =
  "w-full rounded-xl bg-[#c8ff3d] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#d8ff6a] sm:w-auto";

export function ReindexDialog({ state, publishedCount, onClose, onConfirm }: ReindexDialogProps) {
  if (!state) return null;

  if (state.type === "confirm") {
    return (
      <AppDialog
        open
        variant="warning"
        title="Переиндексировать базу знаний?"
        description={
          <>
            Будут пересчитаны фрагменты (chunks) и векторы для{" "}
            <span className="font-semibold text-zinc-200">
              {publishedCount} опубликованных документов
            </span>
            . Операция может занять до минуты — не закрывайте страницу.
          </>
        }
        onClose={onClose}
        footer={
          <>
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Отмена
            </button>
            <button type="button" onClick={onConfirm} className={primaryButtonClass}>
              Запустить переиндексацию
            </button>
          </>
        }
      >
        <ul className="space-y-2 text-sm text-zinc-500">
          <li className="flex gap-2">
            <span className="text-[#c8ff3d]">•</span>
            Черновики не попадают в поиск бота
          </li>
          <li className="flex gap-2">
            <span className="text-[#c8ff3d]">•</span>
            Старые embeddings будут заменены новыми
          </li>
        </ul>
      </AppDialog>
    );
  }

  if (state.type === "success") {
    return (
      <AppDialog
        open
        variant="success"
        title="Переиндексация завершена"
        description="Поиск по базе знаний обновлён. Бот будет использовать новые векторы при ответах."
        onClose={onClose}
        footer={
          <button type="button" onClick={onClose} className={primaryButtonClass}>
            Отлично
          </button>
        }
      >
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Документы
            </dt>
            <dd className="mt-1 font-heading text-xl font-bold text-zinc-50">{state.documents}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Chunks</dt>
            <dd className="mt-1 font-heading text-xl font-bold text-zinc-50">{state.chunks}</dd>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 sm:col-span-1">
            <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Embeddings
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-[#e8ffc4]">
              {state.embeddingsProvider ?? "—"}
            </dd>
          </div>
        </dl>
      </AppDialog>
    );
  }

  return (
    <AppDialog
      open
      variant="error"
      title="Переиндексация не удалась"
      description="Проверьте настройки embeddings в окружении и попробуйте снова."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Закрыть
          </button>
          <button type="button" onClick={onConfirm} className={primaryButtonClass}>
            Повторить
          </button>
        </>
      }
    >
      <p className="rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2.5 text-xs leading-relaxed text-rose-200/90">
        {state.message}
      </p>
    </AppDialog>
  );
}
