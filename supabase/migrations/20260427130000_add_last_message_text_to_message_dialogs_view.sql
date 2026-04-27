-- Expose last_message_text in message_dialogs read view for sidebar previews.

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
  d.last_message_at,
  d.last_message_text,
  d.messages_count
from public.clients as c
join public.dialogs as d on d.client_id = c.id
left join public.client_dialog_states cds on cds.client_id = c.id;

grant select on public.message_dialogs to anon, authenticated;

