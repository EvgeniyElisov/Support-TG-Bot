"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { KnowledgeBaseDocument } from "./knowledge-base-page";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; document: KnowledgeBaseDocument };

function normalizeTags(input: string): string[] {
  const parts = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function KnowledgeBaseView({ initialDocuments }: { initialDocuments: KnowledgeBaseDocument[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialDocuments;
    return initialDocuments.filter((d) => {
      return (
        d.title.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q) ||
        (d.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [initialDocuments, query]);

  const openCreate = () => {
    setEditor({ mode: "create" });
    setTitle("");
    setBody("");
    setTags("");
    setIsPublished(true);
  };

  const openEdit = (doc: KnowledgeBaseDocument) => {
    setEditor({ mode: "edit", document: doc });
    setTitle(doc.title);
    setBody(doc.body);
    setTags((doc.tags ?? []).join(", "));
    setIsPublished(doc.is_published);
  };

  const closeEditor = () => setEditor(null);

  const submit = async () => {
    const payload = {
      title: title.trim(),
      body: body.trim(),
      tags: normalizeTags(tags),
      is_published: isPublished,
    };

    if (!payload.title || !payload.body) {
      alert("Нужны и заголовок, и текст документа.");
      return;
    }

    const isEdit = editor?.mode === "edit";
    const url = isEdit ? `/api/kb-documents/${editor.document.id}` : "/api/kb-documents";
    const method = isEdit ? "PATCH" : "POST";

    startTransition(() => {
      void (async () => {
        const res = await fetch(url, {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          alert(`Не удалось сохранить: ${text || res.statusText}`);
          return;
        }

        closeEditor();
        router.refresh();
      })();
    });
  };

  const remove = async (doc: KnowledgeBaseDocument) => {
    const ok = confirm(`Удалить документ "${doc.title}"?`);
    if (!ok) return;

    startTransition(() => {
      void (async () => {
        const res = await fetch(`/api/kb-documents/${doc.id}`, { method: "DELETE" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          alert(`Не удалось удалить: ${text || res.statusText}`);
          return;
        }
        router.refresh();
      })();
    });
  };

  const reindexAll = async () => {
    const ok = confirm("Переиндексировать все опубликованные документы? Это пересчитает chunks и векторы.");
    if (!ok) return;

    startTransition(() => {
      void (async () => {
        const res = await fetch("/api/kb-reindex", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          alert(`Переиндексация не удалась: ${text || res.statusText}`);
          return;
        }

        const json = (await res.json().catch(() => null)) as
          | { documents?: number; chunks?: number; embeddings_provider?: string }
          | null;
        alert(
          `Готово. Документов: ${json?.documents ?? "?"}, chunks: ${json?.chunks ?? "?"}, embeddings: ${
            json?.embeddings_provider ?? "?"
          }.`,
        );
        router.refresh();
      })();
    });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">Раздел</p>
          <h1 className="font-heading mt-1 text-xl font-bold tracking-tight text-zinc-50">
            База знаний
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Документы, по которым бот будет искать ответы. После изменений нажмите{" "}
            <span className="text-zinc-200">«Переиндексировать»</span>, чтобы обновить поиск.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заголовку, тексту или тегам"
            className="w-full sm:w-[420px] rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-white/20"
          />
          <button
            type="button"
            onClick={reindexAll}
            className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-bold text-zinc-200 hover:border-white/15 hover:bg-white/6 disabled:opacity-50"
            disabled={isPending}
          >
            Переиндексировать
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-[#c8ff3d] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#d8ff6a] disabled:opacity-50"
            disabled={isPending}
          >
            Добавить
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <p className="text-sm font-semibold text-zinc-200">Документы</p>
          <p className="text-xs text-zinc-600">Всего: {initialDocuments.length}</p>
        </div>

        <div className="divide-y divide-white/10">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-sm text-zinc-500">
              Ничего не найдено. Попробуйте другой запрос или добавьте документ.
            </div>
          ) : (
            filtered.map((doc) => (
              <div key={doc.id} className="px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-heading text-base font-semibold text-zinc-50">
                        {doc.title}
                      </p>
                      {doc.is_published ? (
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                          опубликовано
                        </span>
                      ) : (
                        <span className="rounded-full border border-zinc-500/25 bg-white/6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-300">
                          черновик
                        </span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                      {doc.body}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                      <span>Обновлён: {formatDate(doc.updated_at)}</span>
                      {(doc.tags ?? []).length > 0 ? (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span className="truncate">Теги: {(doc.tags ?? []).join(", ")}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                    <button
                      type="button"
                      onClick={() => openEdit(doc)}
                      className="rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-white/15 hover:bg-white/6 disabled:opacity-50"
                      disabled={isPending}
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(doc)}
                      className="rounded-lg border border-red-500/20 bg-red-500/6 px-3 py-1.5 text-xs font-bold text-red-200 hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                      disabled={isPending}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {editor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#08070b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <p className="text-sm font-semibold text-zinc-200">
                {editor.mode === "create" ? "Новый документ" : "Редактирование"}
              </p>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-white/15 hover:bg-white/6 disabled:opacity-50"
                disabled={isPending}
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">
                    Заголовок
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20"
                    placeholder="Например: Как оформить возврат"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">
                    Теги (через запятую)
                  </label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-white/20"
                    placeholder="оплата, доставка, возврат"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-600">
                  Текст
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 outline-none focus:border-white/20"
                  placeholder="Полный текст документа…"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/2 px-3 py-2.5 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4"
                />
                Показывать в поиске (опубликовано)
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3.5">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-bold text-zinc-200 hover:border-white/15 hover:bg-white/6 disabled:opacity-50"
                disabled={isPending}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-xl bg-[#c8ff3d] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#d8ff6a] disabled:opacity-50"
                disabled={isPending}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

