-- Delivery/read statuses for outbound messages (admin panel UX).
-- These fields are nullable and can be populated by the Telegram sending pipeline later.

alter table public.messages
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz;

comment on column public.messages.delivered_at is 'When outbound message was delivered to the client (if known)';
comment on column public.messages.read_at is 'When outbound message was read by the client (if known)';

create index if not exists messages_delivered_at_idx on public.messages (delivered_at);
create index if not exists messages_read_at_idx on public.messages (read_at);

