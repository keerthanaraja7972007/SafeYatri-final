create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  last_sign_in_at timestamptz
);
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('registration','login','logout','tourist_place_viewed','risk_assessment_viewed','emergency_search','sos_submitted','sos_status_changed','profile_updated')),
  resource_id text,
  metadata jsonb not null default '{}'::jsonb check (metadata = '{}'::jsonb),
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_user_created_idx on public.activity_logs (user_id, created_at desc);
create index if not exists activity_logs_type_created_idx on public.activity_logs (event_type, created_at desc);

create or replace function public.is_safeyatri_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_safeyatri_admin() from public;
grant execute on function public.is_safeyatri_admin() to authenticated;

create or replace function public.handle_new_safeyatri_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'user')
  on conflict (id) do nothing;
  insert into public.activity_logs (user_id, event_type) values (new.id, 'registration');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_safeyatri on auth.users;
create trigger on_auth_user_created_safeyatri after insert on auth.users
for each row execute function public.handle_new_safeyatri_user();

-- Preserve visibility of accounts created before this migration. Historical
-- registration activity cannot be reconstructed from the old frontend.
insert into public.profiles (id, email, full_name, role, created_at, last_sign_in_at)
select u.id, coalesce(u.email, ''), coalesce(u.raw_user_meta_data ->> 'full_name', ''), 'user', u.created_at, u.last_sign_in_at
from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;
revoke all on public.profiles, public.activity_logs from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert on public.activity_logs to authenticated;
drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_safeyatri_admin()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists activity_insert_self on public.activity_logs;
create policy activity_insert_self on public.activity_logs for insert to authenticated with check (user_id = (select auth.uid()) and event_type in ('logout','tourist_place_viewed','risk_assessment_viewed','emergency_search') and (resource_id is null or length(resource_id) <= 200));
drop policy if exists activity_read_admin on public.activity_logs;
create policy activity_read_admin on public.activity_logs for select to authenticated using ((select public.is_safeyatri_admin()));

create or replace function public.record_safeyatri_login()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles set last_sign_in_at = now() where id = auth.uid();
  insert into public.activity_logs (user_id, event_type) values (auth.uid(), 'login');
end;
$$;
revoke all on function public.record_safeyatri_login() from public;
grant execute on function public.record_safeyatri_login() to authenticated;

create or replace function public.get_safeyatri_admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_safeyatri_admin() then raise exception 'Administrator access required'; end if;
  return jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_users_30d', (select count(*) from public.profiles where last_sign_in_at >= now() - interval '30 days'),
    'total_events', (select count(*) from public.activity_logs),
    'logins', (select count(*) from public.activity_logs where event_type = 'login'),
    'registrations', (select count(*) from public.activity_logs where event_type = 'registration')
  );
end;
$$;
revoke all on function public.get_safeyatri_admin_overview() from public;
grant execute on function public.get_safeyatri_admin_overview() to authenticated;

create or replace function public.get_safeyatri_admin_users()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_safeyatri_admin() then raise exception 'Administrator access required'; end if;
  return query select p.id, p.email, p.full_name, p.role, p.created_at, p.last_sign_in_at from public.profiles p order by p.created_at desc;
end;
$$;
revoke all on function public.get_safeyatri_admin_users() from public;
grant execute on function public.get_safeyatri_admin_users() to authenticated;

create or replace function public.get_safeyatri_admin_activity()
returns table (id uuid, user_id uuid, email text, full_name text, event_type text, resource_id text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_safeyatri_admin() then raise exception 'Administrator access required'; end if;
  return query select a.id, a.user_id, p.email, p.full_name, a.event_type, a.resource_id, a.created_at from public.activity_logs a left join public.profiles p on p.id = a.user_id order by a.created_at desc limit 500;
end;
$$;
revoke all on function public.get_safeyatri_admin_activity() from public;
grant execute on function public.get_safeyatri_admin_activity() to authenticated;

-- Preserve public reference-data reads while limiting writes to verified admins.
do $$
declare tab text; action text;
begin
  foreach tab in array array['tourist_places','data_sources','weather_data','crime_data','emergency_services','tourism_context','data_imports','preprocessing_logs'] loop
    foreach action in array array['INSERT','UPDATE','DELETE'] loop
      execute format('drop policy if exists %I on public.%I', lower('auth_' || action || '_' || tab), tab);
      if action = 'INSERT' then
        execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_safeyatri_admin()))', lower('admin_' || action || '_' || tab), tab);
      elsif action = 'UPDATE' then
        execute format('create policy %I on public.%I for update to authenticated using ((select public.is_safeyatri_admin())) with check ((select public.is_safeyatri_admin()))', lower('admin_' || action || '_' || tab), tab);
      else
        execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_safeyatri_admin()))', lower('admin_' || action || '_' || tab), tab);
      end if;
    end loop;
  end loop;
end $$;
