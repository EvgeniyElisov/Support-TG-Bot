-- Таблица clients по ERD + перенос профиля из messages и приведение messages к схеме ERD.
-- Предполагается: существующая таблица messages (chat_id, …) с историческими данными.

drop view if exists public.message_dialogs;
drop view if exists public.message_stats;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null unique,
  telegram_user_id bigint,
  username varchar(255),
  first_name varchar(255),
  last_name varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clients is 'Уникальный клиент (диалог Telegram) по chat_id';
comment on column public.clients.telegram_user_id is 'Telegram user id отправителя (from.id)';

-- Профиль: последнее по времени сообщение по chat_id; created_at клиента — время первого сообщения в чате.
insert into public.clients (chat_id, telegram_user_id, username, first_name, last_name, created_at, updated_at)
with latest as (
  select distinct on (chat_id)
    chat_id,
    user_id,
    username,
    first_name,
    last_name,
    created_at
  from public.messages
  order by chat_id, created_at desc
),
first_msg as (
  select chat_id, min(created_at) as created_at
  from public.messages
  group by chat_id
)
select
  l.chat_id,
  l.user_id,
  l.username,
  l.first_name,
  l.last_name,
  f.created_at,
  l.created_at
from latest l
join first_msg f on f.chat_id = l.chat_id;

alter table public.messages add column client_id uuid references public.clients (id) on delete cascade;

update public.messages m
set client_id = c.id
from public.clients c
where c.chat_id = m.chat_id;

alter table public.messages alter column client_id set not null;

alter table public.messages drop constraint messages_chat_id_message_id_key;

alter table public.messages drop column chat_id;
alter table public.messages drop column user_id;
alter table public.messages drop column username;
alter table public.messages drop column first_name;
alter table public.messages drop column last_name;
alter table public.messages drop column message_id;
alter table public.messages drop column caption;
alter table public.messages drop column raw;

alter table public.clients enable row level security;

create policy "Allow public read clients" on public.clients
  for select
  using (true);

grant select on table public.clients to anon, authenticated;

-- Представления под новую схему (профиль из clients)
create view public.message_dialogs as
select
  c.chat_id,
  c.username,
  c.first_name,
  c.last_name,
  max(m.created_at) as last_message_at,
  count(*)::bigint as messages_count
from public.messages as m
join public.clients as c on c.id = m.client_id
group by c.id;

create view public.message_stats as
select
  count(*)::bigint as total_messages,
  count(distinct client_id)::bigint as total_unique_users
from public.messages;

grant select on public.message_dialogs to anon, authenticated;
grant select on public.message_stats to anon, authenticated;
