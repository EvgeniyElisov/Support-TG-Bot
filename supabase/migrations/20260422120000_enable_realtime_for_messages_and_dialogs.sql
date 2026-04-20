-- Включаем Supabase Realtime (postgres_changes) для нужных таблиц.
-- Supabase использует публикацию `supabase_realtime`.

do $$
begin
  -- messages
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then
      null;
    when undefined_object then
      raise notice 'publication supabase_realtime does not exist (is Realtime enabled?)';
  end;

  -- dialogs
  begin
    alter publication supabase_realtime add table public.dialogs;
  exception
    when duplicate_object then
      null;
    when undefined_object then
      raise notice 'publication supabase_realtime does not exist (is Realtime enabled?)';
  end;
end;
$$;

