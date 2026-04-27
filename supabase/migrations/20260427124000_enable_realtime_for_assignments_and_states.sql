-- Enable Supabase Realtime (postgres_changes) for assignment/state tables.
-- Needed for admin panel live sync of current_manager_id and dialog_status.

do $$
begin
  -- client_assignments
  begin
    alter publication supabase_realtime add table public.client_assignments;
  exception
    when duplicate_object then
      null;
    when undefined_object then
      raise notice 'publication supabase_realtime does not exist (is Realtime enabled?)';
  end;

  -- client_dialog_states
  begin
    alter publication supabase_realtime add table public.client_dialog_states;
  exception
    when duplicate_object then
      null;
    when undefined_object then
      raise notice 'publication supabase_realtime does not exist (is Realtime enabled?)';
  end;
end;
$$;

