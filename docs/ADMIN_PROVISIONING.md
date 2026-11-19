# SAFEYATRI account setup and administrator provisioning

## Apply the database migration

Apply `supabase/migrations/20261007090000_auth_admin.sql` to the existing linked Supabase project using the Supabase CLI (`supabase db push`) or the Supabase SQL editor. Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` client configuration. The application must never receive a service-role key.

The migration creates `profiles` and append-only `activity_logs`, inserts new profiles with role `user`, enables RLS, and adds admin-only RPCs. It also tightens write policies on existing reference-data tables so authenticated users without the admin role cannot write to them. Existing public read policies and stored records are retained.

It backfills existing Supabase Auth accounts into `profiles` with the default `user` role, preserving their account creation and last sign-in timestamps. Historical application events cannot be reconstructed. Add the deployed `/login` and `/reset-password` URLs to Supabase Auth's allowed redirect URLs, and configure the email templates/provider for verification and password recovery.

## Create the first administrator

1. Register a normal account through `/register` and complete email verification if Supabase requires it.
2. In the trusted Supabase SQL editor (or another privileged database session), promote that exact account using its email:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) = lower('admin@example.com')
RETURNING id, email, role;
```

Replace the example with the verified account's email. Confirm that exactly one row is returned with role `admin`. The browser registration flow has no role field, and authenticated clients receive no permission to update `profiles.role`.

## Activity and SOS scope

Registration is recorded by a database trigger. Successful logins update `last_sign_in_at` and append a login event through a role-independent authenticated RPC. Logout, tourist-place viewing, risk-assessment viewing, and settled emergency searches are recorded for signed-in users. The log table has no update or delete policy for application users; admins read it through a role-checked RPC.

The existing SOS flow stores data only in browser memory and does not persist it. This dashboard therefore reports that persistent SOS statistics are unavailable and preserves the existing local SOS monitor without claiming responder notification.

## Active-user definition

The dashboard counts a profile as active when it has a successful login recorded in the preceding 30 days. This is based on login events recorded after the migration is applied.
