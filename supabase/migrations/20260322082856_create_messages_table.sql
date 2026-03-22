-- Входящие сообщения пользователей Telegram-бота (вебхук grammY).
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id bigint not null,
  user_id bigint,
  username varchar(255),
  first_name varchar(255),
  last_name varchar(255),
  message_id bigint not null,
  created_at timestamptz not null default now(),
  -- Текст или подпись; для медиа без подписи оба могут быть null.
  text_content text,
  caption text,
  -- Полный объект Message из Update (удобно для типа медиа, entities и т.д.).
  raw jsonb not null,
  unique (chat_id, message_id)
);
