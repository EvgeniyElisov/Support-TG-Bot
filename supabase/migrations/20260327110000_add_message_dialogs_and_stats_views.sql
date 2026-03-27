-- Агрегация для списка диалогов (по Telegram chat_id)
create view public.message_dialogs as
with latest_message as (
  select distinct on (m.chat_id)
    m.chat_id,
    m.username,
    m.first_name,
    m.last_name,
    m.created_at as last_message_at
  from public.messages as m
  order by m.chat_id, m.created_at desc
)
select
  m.chat_id,
  lm.username,
  lm.first_name,
  lm.last_name,
  max(m.created_at) as last_message_at,
  count(*)::bigint as messages_count
from public.messages as m
join latest_message as lm on lm.chat_id = m.chat_id
group by m.chat_id, lm.username, lm.first_name, lm.last_name, lm.last_message_at;

-- Глобальные метрики сообщений
create view public.message_stats as
select
  count(*)::bigint as total_messages,
  count(distinct chat_id)::bigint as total_unique_users
from public.messages;

grant select on public.message_dialogs to anon, authenticated;
grant select on public.message_stats to anon, authenticated;
