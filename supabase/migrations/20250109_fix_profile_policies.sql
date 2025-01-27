-- Drop existing policies
drop policy if exists "enable_read_access" on "public"."profiles";
drop policy if exists "enable_update_access" on "public"."profiles";

-- Create new read policy
create policy "profiles_read_policy" on "public"."profiles"
for select using (
  auth.role() = 'authenticated'
);

-- Create new update policy for users
create policy "profiles_update_own" on "public"."profiles"
for update using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);

-- Create new update policy for admins
create policy "profiles_admin_update" on "public"."profiles"
for update using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'::user_role
  )
);

-- Make sure RLS is enabled
alter table "public"."profiles" enable row level security;
