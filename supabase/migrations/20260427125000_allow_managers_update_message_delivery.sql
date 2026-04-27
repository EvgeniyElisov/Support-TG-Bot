-- Allow managers to update outbound message delivery status fields.
-- We keep updates scoped by RLS and column-level privileges.

grant select on table public.messages to anon, authenticated;
grant update (delivered_at, read_at, failed_at, send_error) on table public.messages to authenticated;

drop policy if exists "Managers update own outbound delivery status" on public.messages;
create policy "Managers update own outbound delivery status" on public.messages
  for update
  to authenticated
  using (direction = 'outbound' and sent_by_manager_id = auth.uid())
  with check (direction = 'outbound' and sent_by_manager_id = auth.uid());

