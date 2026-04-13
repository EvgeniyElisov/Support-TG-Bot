-- Статусы диалога на clients + представление message_dialogs + RPC смены статуса менеджером.

alter table public.clients
  add column dialog_status text not null default 'new'
    constraint clients_dialog_status_check
    check (dialog_status in ('new', 'in_progress', 'waiting_client', 'closed'));

comment on column public.clients.dialog_status is
  'Статус диалога: new | in_progress | waiting_client | closed';

drop view if exists public.message_dialogs;

create view public.message_dialogs as
select
  c.id as client_id,
  c.chat_id,
  c.username,
  c.first_name,
  c.last_name,
  c.dialog_status,
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
group by c.id;

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
declare
  v_affected int;
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

  update public.clients
  set dialog_status = p_status, updated_at = now()
  where id = p_client_id;

  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    raise exception 'client not found';
  end if;
end;
$$;

revoke all on function public.set_client_dialog_status(uuid, text) from public;
grant execute on function public.set_client_dialog_status(uuid, text) to authenticated;
