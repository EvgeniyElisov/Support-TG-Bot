-- Исходящие сообщения из панели: направление + автор; RPC для вставки от имени назначенного менеджера.

alter table public.messages
  add column direction text not null default 'inbound'
    constraint messages_direction_check check (direction in ('inbound', 'outbound')),
  add column sent_by_manager_id uuid references public.managers (user_id) on delete set null;

comment on column public.messages.direction is 'inbound — от пользователя в Telegram, outbound — ответ менеджера из админки';
comment on column public.messages.sent_by_manager_id is 'Для outbound: auth.users id менеджера, отправившего ответ';

update public.messages set direction = 'inbound' where true;

create or replace function public.insert_manager_reply(
  p_client_id uuid,
  p_text text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_assigned uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.managers where user_id = auth.uid()) then
    raise exception 'not a manager';
  end if;

  if p_text is null or length(trim(p_text)) = 0 then
    raise exception 'empty message';
  end if;

  select ca.current_manager_id into v_assigned
  from public.client_assignments ca
  where ca.client_id = p_client_id;

  if v_assigned is null or v_assigned <> auth.uid() then
    raise exception 'not assigned to this dialog';
  end if;

  insert into public.messages (client_id, text_content, direction, sent_by_manager_id)
  values (p_client_id, trim(p_text), 'outbound', auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.insert_manager_reply(uuid, text) from public;
grant execute on function public.insert_manager_reply(uuid, text) to authenticated;
