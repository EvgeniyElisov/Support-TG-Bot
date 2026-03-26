-- Включаем Row Level Security
alter table public.messages enable row level security;

-- Разрешаем читать всем (для админки через anon key)
-- Edge Function пишет через service_role — RLS на неё не действует
create policy "Allow public read" on public.messages
  for select
  using (true);
