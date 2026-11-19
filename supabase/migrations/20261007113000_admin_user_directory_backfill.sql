-- Ensure new Auth users receive a user-only profile with the Auth account timestamp.
create or replace function public.handle_new_safeyatri_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, role, created_at)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'user', new.created_at)
  on conflict (id) do nothing;
  insert into public.activity_logs (user_id, event_type) values (new.id, 'registration');
  return new;
end;
$$;
revoke all on function public.handle_new_safeyatri_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_safeyatri on auth.users;
create trigger on_auth_user_created_safeyatri after insert on auth.users
for each row execute function public.handle_new_safeyatri_user();

-- Keep the admin user directory complete if an auth trigger was unavailable during signup.
-- The RPC remains admin-only and profiles stay protected by their existing RLS policies.
create or replace function public.get_safeyatri_admin_users()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_safeyatri_admin() then raise exception 'Administrator access required'; end if;

  insert into public.profiles (id, email, full_name, role, created_at, last_sign_in_at)
  select u.id, coalesce(u.email, ''), coalesce(u.raw_user_meta_data ->> 'full_name', ''), 'user', u.created_at, u.last_sign_in_at
  from auth.users u
  on conflict (id) do update set
    email = excluded.email,
    created_at = excluded.created_at,
    last_sign_in_at = coalesce(excluded.last_sign_in_at, profiles.last_sign_in_at);

  return query
  select p.id, p.email, p.full_name, p.role, p.created_at, p.last_sign_in_at
  from public.profiles p
  order by p.created_at desc;
end;
$$;
revoke all on function public.get_safeyatri_admin_users() from public, anon;
grant execute on function public.get_safeyatri_admin_users() to authenticated;
