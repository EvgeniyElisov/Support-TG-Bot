-- Перенос статуса диалога из clients в отдельную таблицу состояния.

create table if not exists public.client_dialog_states (
  client_id uuid primary key references public.clients (id) on delete cascade,
  status text not null default 'new'
    constraint client_dialog_states_status_check
    check (status in ('new', 'in_progress', 'waiting_client', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.client_dialog_states is
  'Состояние рабочего диалога клиента в support-процессе';
comment on column public.client_dialog_states.status is
  'Статус диалога: new | in_progress | waiting_client | closed';

insert into public.client_dialog_states (client_id, status)
select c.id, c.dialog_status
from public.clients c
on conflict (client_id) do update
set status = excluded.status,
    updated_at = now();

create or replace function public.ensure_client_dialog_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.client_dialog_states (client_id)
  values (new.id)
  on conflict (client_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_client_dialog_state on public.clients;
create trigger trg_ensure_client_dialog_state
after insert on public.clients
for each row
execute function public.ensure_client_dialog_state();

drop view if exists public.message_dialogs;

create view public.message_dialogs as
select
  c.id as client_id,
  c.chat_id,
  c.username,
  c.first_name,
  c.last_name,
  coalesce(cds.status, 'new') as dialog_status,
  (
    select ca.current_manager_id
    from public.client_assignments ca
    where ca.client_id = c.id
    limit 1
  ) as current_manager_id,
  (
    select ca.assigned_by_manager_id
    from public.client_assignments ca
    where ca.client_id = c.id
    limit 1
  ) as assigned_by_manager_id,
  (
    select am.first_name
    from public.managers am
    where am.user_id = (
      select ca.current_manager_id from public.client_assignments ca where ca.client_id = c.id limit 1
    )
    limit 1
  ) as current_manager_first_name,
  (
    select am.last_name
    from public.managers am
    where am.user_id = (
      select ca.current_manager_id from public.client_assignments ca where ca.client_id = c.id limit 1
    )
    limit 1
  ) as current_manager_last_name,
  (
    select act.first_name
    from public.managers act
    where act.user_id = (
      select ca.assigned_by_manager_id from public.client_assignments ca where ca.client_id = c.id limit 1
    )
    limit 1
  ) as assigned_by_manager_first_name,
  (
    select act.last_name
    from public.managers act
    where act.user_id = (
      select ca.assigned_by_manager_id from public.client_assignments ca where ca.client_id = c.id limit 1
    )
    limit 1
  ) as assigned_by_manager_last_name,
  max(m.created_at) as last_message_at,
  count(*)::bigint as messages_count
from public.messages as m
join public.clients as c on c.id = m.client_id
left join public.client_dialog_states cds on cds.client_id = c.id
group by c.id, cds.status;

grant select on public.message_dialogs to anon, authenticated;

create or replace function public.set_client_dialog_status(
  p_client_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.managers where user_id = auth.uid()) then
    raise exception 'not a manager';
  end if;
  if p_status not in ('new', 'in_progress', 'waiting_client', 'closed') then
    raise exception 'invalid status';
  end if;
  if not exists (select 1 from public.clients where id = p_client_id) then
    raise exception 'client not found';
  end if;

  insert into public.client_dialog_states (client_id, status)
  values (p_client_id, p_status)
  on conflict (client_id) do update
  set status = excluded.status,
      updated_at = now();
end;
$$;

revoke all on function public.set_client_dialog_status(uuid, text) from public;
grant execute on function public.set_client_dialog_status(uuid, text) to authenticated;

alter table public.clients
  drop constraint if exists clients_dialog_status_check;

alter table public.clients
  drop column if exists dialog_status;
