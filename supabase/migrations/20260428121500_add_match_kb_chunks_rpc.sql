-- RPC for vector similarity search over kb_chunks.
-- Used by Edge Functions via supabase.rpc('match_kb_chunks', ...).

set local search_path = public, extensions;

create or replace function public.match_kb_chunks(
  query_embedding vector,
  match_count int default 8
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  chunk_text text,
  similarity float4
)
language sql
stable
as $$
  select
    c.id,
    c.document_id,
    c.chunk_index,
    c.chunk_text,
    (1 - (c.embedding <=> query_embedding))::float4 as similarity
  from public.kb_chunks c
  where c.embedding is not null
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

comment on function public.match_kb_chunks(vector, int) is 'Vector similarity search for RAG (kb_chunks)';

