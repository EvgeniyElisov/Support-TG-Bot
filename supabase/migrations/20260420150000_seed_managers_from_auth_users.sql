-- По одной записи в public.managers для каждого пользователя из auth.users (ещё без строки в managers).
-- Имя берётся из raw_user_meta_data (full_name / name / first+last) или из локальной части email.

insert into public.managers (user_id, first_name, last_name, company_role)
with src as (
  select
    u.id,
    coalesce(
      nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(u.raw_user_meta_data->>'name'), ''),
      trim(split_part(coalesce(u.email, ''), '@', 1))
    ) as display_name,
    nullif(trim(u.raw_user_meta_data->>'first_name'), '') as meta_first,
    nullif(trim(u.raw_user_meta_data->>'last_name'), '') as meta_last
  from auth.users as u
  where not exists (select 1 from public.managers as m where m.user_id = u.id)
)
select
  id,
  coalesce(
    meta_first,
    nullif(split_part(display_name, ' ', 1), ''),
    'User'
  ) as first_name,
  coalesce(
    meta_last,
    case
      when position(' ' in display_name) > 0 then
        trim(substring(display_name from position(' ' in display_name) + 1))
    end,
    '-'
  ) as last_name,
  'Manager' as company_role
from src
on conflict (user_id) do nothing;
