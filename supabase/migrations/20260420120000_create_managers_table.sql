-- Профили менеджеров поддержки: связь 1:1 с Supabase Auth (auth.users).

create table public.managers (
  user_id uuid primary key references auth.users (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  company_role text not null,
  created_at timestamptz not null default now()
);

comment on table public.managers is 'Менеджеры поддержки, привязанные к auth.users';
comment on column public.managers.company_role is 'Роль / должность в компании';

alter table public.managers enable row level security;

create policy "Managers select own row" on public.managers
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Managers insert own row" on public.managers
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Managers update own row" on public.managers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.managers to authenticated;
