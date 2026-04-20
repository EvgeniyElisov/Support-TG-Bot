-- Read-model для сайдбара диалогов: материализованное состояние вместо агрегирующего view.

create table if not exists public.dialogs (
  client_id uuid primary key references public.clients (id) on delete cascade,
  last_message_at timestamptz,
  last_message_text text,
  messages_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.dialogs is
  'Read-model диалогов для быстрых списков (last_message_*, messages_count)';

comment on column public.dialogs.last_message_text is
  'Последний текст/подпись сообщения (для превью в списке)';

-- Backfill из истории сообщений (без потери данных).
insert into public.dialogs (client_id, last_message_at, last_message_text, messages_count, updated_at)
select
  m.client_id,
  max(m.created_at) as last_message_at,
  (array_agg(m.text_content order by m.created_at desc))[1] as last_message_text,
  count(*)::bigint as messages_count,
  now() as updated_at
from public.messages m
group by m.client_id
on conflict (client_id) do update
set last_message_at = excluded.last_message_at,
    last_message_text = excluded.last_message_text,
    messages_count = excluded.messages_count,
    updated_at = excluded.updated_at;

-- Для клиентов без сообщений (редко, но на всякий).
insert into public.dialogs (client_id)
select c.id
from public.clients c
left join public.dialogs d on d.client_id = c.id
where d.client_id is null
on conflict (client_id) do nothing;

create or replace function public.ensure_dialog_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dialogs (client_id)
  values (new.id)
  on conflict (client_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_dialog_row on public.clients;
create trigger trg_ensure_dialog_row
after insert on public.clients
for each row
execute function public.ensure_dialog_row();

create or replace function public.dialogs_apply_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dialogs (client_id, last_message_at, last_message_text, messages_count, updated_at)
  values (new.client_id, new.created_at, new.text_content, 1, now())
  on conflict (client_id) do update
  set last_message_at = greatest(public.dialogs.last_message_at, excluded.last_message_at),
      last_message_text = case
        when public.dialogs.last_message_at is null then excluded.last_message_text
        when excluded.last_message_at >= public.dialogs.last_message_at then excluded.last_message_text
        else public.dialogs.last_message_text
      end,
      messages_count = public.dialogs.messages_count + 1,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_dialogs_apply_message_insert on public.messages;
create trigger trg_dialogs_apply_message_insert
after insert on public.messages
for each row
execute function public.dialogs_apply_message_insert();

grant select on public.dialogs to anon, authenticated;

