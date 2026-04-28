import { createSupabaseServerClient } from "@/shared/api/supabase/server";
import { KnowledgeBaseView } from "./knowledge-base-view";

export type KnowledgeBaseDocument = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export async function KnowledgeBasePage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("kb_documents" as any)
    .select("id,title,body,tags,is_published,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/6 px-4 py-3 text-sm text-red-200">
          Не удалось загрузить базу знаний: {error.message}
        </div>
      </div>
    );
  }

  return <KnowledgeBaseView initialDocuments={(data ?? []) as unknown as KnowledgeBaseDocument[]} />;
}

