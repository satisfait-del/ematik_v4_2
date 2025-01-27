-- Enable RLS
alter table "public"."profiles" enable row level security;

-- Create policy to allow admins to see all profiles
create policy "admins_can_view_all_profiles" on "public"."profiles"
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create policy for users to see their own profile
create policy "users_can_view_own_profile" on "public"."profiles"
  for select using (
    auth.uid() = id
  );

-- Create policy for admins to update any profile
create policy "admins_can_update_all_profiles" on "public"."profiles"
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create policy for users to update their own profile
create policy "users_can_update_own_profile" on "public"."profiles"
  for update using (
    auth.uid() = id
  );
