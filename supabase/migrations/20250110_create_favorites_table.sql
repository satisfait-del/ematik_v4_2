-- Create favorites table
create table if not exists "public"."favorites" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "service_id" uuid not null references services(id) on delete cascade,
    "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key ("id"),
    unique("user_id", "service_id")
);

-- Enable RLS
alter table "public"."favorites" enable row level security;

-- Create policies
create policy "Users can view their own favorites"
on "public"."favorites"
for select using (
    auth.uid() = user_id
);

create policy "Users can insert their own favorites"
on "public"."favorites"
for insert with check (
    auth.uid() = user_id
);

create policy "Users can delete their own favorites"
on "public"."favorites"
for delete using (
    auth.uid() = user_id
);

-- Grant access to authenticated users
grant all on table "public"."favorites" to authenticated;

-- Create indexes
create index if not exists idx_favorites_user_id on favorites(user_id);
create index if not exists idx_favorites_service_id on favorites(service_id);
