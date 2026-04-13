-- Таблица client_assignments (0..1 строка на клиента) по ERD + RPC назначения + обновление message_dialogs.

drop view if exists public.message_dialogs;

create table public.client_assignments (
  client_id uuid primary key references public.clients (id) on delete restrict,
  current_manager_id uuid references public.managers (user_id) on delete set null,
  assigned_by_manager_id uuid references public.managers (user_id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.client_assignments is
  'Назначение менеджера на клиента (0..1 на clients). Строка появляется при первом assign/unassign; до этого записи может не быть.';
comment on column public.client_assignments.current_manager_id is 'Текущий ответственный (nullable)';
comment on column public.client_assignments.assigned_by_manager_id is 'Кто последним выполнил назначение или снятие';

alter table public.client_assignments enable row level security;

create policy "Allow public read client_assignments" on public.client_assignments
  for select
  using (true);

grant select on table public.client_assignments to anon, authenticated;

-- Справочник менеджеров в админке: любой менеджер видит всех (раньше — только свою строку).
drop policy if exists "Managers select own row" on public.managers;

create policy "Managers read directory" on public.managers
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.managers as m
      where m.user_id = auth.uid()
    )
  );

create or replace function public.set_client_assignment(
  p_client_id uuid,
  p_current_manager_id uuid
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
  if p_current_manager_id is not null
     and not exists (select 1 from public.managers where user_id = p_current_manager_id) then
    raise exception 'invalid manager';
  end if;

  if not exists (select 1 from public.clients where id = p_client_id) then
    raise exception 'client not found';
  end if;

  insert into public.client_assignments (client_id, current_manager_id, assigned_by_manager_id, updated_at)
  values (p_client_id, p_current_manager_id, auth.uid(), now())
  on conflict (client_id) do update set
    current_manager_id = excluded.current_manager_id,
    assigned_by_manager_id = excluded.assigned_by_manager_id,
    updated_at = excluded.updated_at;

  get diagnostics v_affected = row_count;
  if v_affected = 0 then
    raise exception 'assignment update failed';
  end if;
end;
$$;

revoke all on function public.set_client_assignment(uuid, uuid) from public;
grant execute on function public.set_client_assignment(uuid, uuid) to authenticated;

create view public.message_dialogs as
select
  c.id as client_id,
  c.chat_id,
  c.username,
  c.first_name,
  c.last_name,
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
