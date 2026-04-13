-- Политика «Managers read directory» с EXISTS по managers вызывала бесконечную рекурсию RLS.
-- Проверка «текущий пользователь — менеджер» вынесена в SECURITY DEFINER (владелец обходит RLS при SELECT).

create or replace function public.auth_is_managers_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.managers
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.auth_is_managers_member() from public;
grant execute on function public.auth_is_managers_member() to authenticated;

drop policy if exists "Managers read directory" on public.managers;

create policy "Managers read directory" on public.managers
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.auth_is_managers_member()
  );
