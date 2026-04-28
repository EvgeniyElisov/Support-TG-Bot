-- Knowledge base for RAG (documents + chunks).

-- Vector extension (pgvector). In Supabase this is typically available.
create extension if not exists vector with schema extensions;

-- Ensure operator classes/functions are available via search_path for <=> etc.
-- (pgvector objects live in the extension schema).
set local search_path = public, extensions;

create table if not exists public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  tags text[] not null default '{}'::text[],
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.kb_documents is 'Knowledge base documents (human-editable source of truth)';

create index if not exists kb_documents_updated_at_idx on public.kb_documents (updated_at desc);
create index if not exists kb_documents_is_published_idx on public.kb_documents (is_published);

create table if not exists public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents (id) on delete cascade,
  chunk_index int not null default 0,
  chunk_text text not null,
  token_count int,
  -- Keep dimension flexible for now (we'll decide after choosing embedding model).
  embedding vector,
  created_at timestamptz not null default now()
);

comment on table public.kb_chunks is 'Knowledge base chunks used for retrieval (vector search)';

create index if not exists kb_chunks_document_id_idx on public.kb_chunks (document_id);

-- RLS: allow only authenticated users from admin panel.
alter table public.kb_documents enable row level security;
alter table public.kb_chunks enable row level security;

do $$
begin
  -- kb_documents
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_documents' and policyname = 'kb_documents_auth_select'
  ) then
    create policy kb_documents_auth_select on public.kb_documents
      for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_documents' and policyname = 'kb_documents_auth_insert'
  ) then
    create policy kb_documents_auth_insert on public.kb_documents
      for insert to authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_documents' and policyname = 'kb_documents_auth_update'
  ) then
    create policy kb_documents_auth_update on public.kb_documents
      for update to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_documents' and policyname = 'kb_documents_auth_delete'
  ) then
    create policy kb_documents_auth_delete on public.kb_documents
      for delete to authenticated
      using (true);
  end if;

  -- kb_chunks
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_chunks' and policyname = 'kb_chunks_auth_select'
  ) then
    create policy kb_chunks_auth_select on public.kb_chunks
      for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'kb_chunks' and policyname = 'kb_chunks_auth_write'
  ) then
    create policy kb_chunks_auth_write on public.kb_chunks
      for all to authenticated
      using (true)
      with check (true);
  end if;
end;
$$;

grant select, insert, update, delete on public.kb_documents to authenticated;
grant select, insert, update, delete on public.kb_chunks to authenticated;

