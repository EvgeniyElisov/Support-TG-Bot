-- Outbound message send failures (admin panel UX).
-- Used when we write the message row first (RPC) and then Telegram sendMessage fails.

alter table public.messages
  add column if not exists failed_at timestamptz,
  add column if not exists send_error text;

comment on column public.messages.failed_at is 'When outbound message failed to send to Telegram (best-effort)';
comment on column public.messages.send_error is 'Last send error description (best-effort)';

create index if not exists messages_failed_at_idx on public.messages (failed_at);

