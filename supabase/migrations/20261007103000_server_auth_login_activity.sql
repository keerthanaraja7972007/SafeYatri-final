-- Record login activity from Supabase Auth's server-created session rows.
-- A browser can no longer create or replay login events by calling an RPC.
alter table public.activity_logs
  add column if not exists auth_session_id uuid;

create unique index if not exists activity_login_session_once
  on public.activity_logs (auth_session_id)
  where event_type = 'login';

create or replace function public.log_safeyatri_auth_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    return new;
  end if;

  update public.profiles
  set last_sign_in_at = new.created_at
  where id = new.user_id;

  insert into public.activity_logs (user_id, event_type, auth_session_id, created_at)
  values (new.user_id, 'login', new.id, new.created_at)
  on conflict (auth_session_id) where event_type = 'login' do nothing;

  return new;
end;
$$;
revoke all on function public.log_safeyatri_auth_session() from public, anon, authenticated;
grant execute on function public.log_safeyatri_auth_session() to supabase_auth_admin;

drop trigger if exists on_safeyatri_auth_session_created on auth.sessions;
create trigger on_safeyatri_auth_session_created
  after insert on auth.sessions
  for each row execute function public.log_safeyatri_auth_session();

-- Retire the old client-callable login recorder. The trigger above is now the
-- only application path that can insert login events or update last_sign_in_at.
revoke all on function public.record_safeyatri_login() from public, anon, authenticated;
