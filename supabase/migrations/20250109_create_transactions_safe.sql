-- Vérifier et créer les types s'ils n'existent pas
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type transaction_type as enum ('recharge', 'purchase', 'refund');
    end if;

    if not exists (select 1 from pg_type where typname = 'transaction_status') then
        create type transaction_status as enum ('en_cours', 'complete', 'echec', 'annule');
    end if;
end $$;

-- Créer la table transactions si elle n'existe pas
create table if not exists "public"."transactions" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    "updated_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "type" transaction_type not null,
    "status" transaction_status not null default 'en_cours',
    "amount" decimal(10,2) not null check (amount > 0),
    "description" text,
    "payment_method" text,
    "payment_details" jsonb,
    constraint transactions_pkey primary key (id)
);

-- Activer RLS s'il n'est pas déjà activé
alter table if exists "public"."transactions" enable row level security;

-- Supprimer les politiques existantes si elles existent
drop policy if exists "Users can view their own transactions" on "public"."transactions";
drop policy if exists "Users can create their own transactions" on "public"."transactions";
drop policy if exists "Only admins can update transactions" on "public"."transactions";

-- Créer les nouvelles politiques
create policy "Users can view their own transactions"
on "public"."transactions"
for select using (
    auth.uid() = user_id
    or exists (
        select 1 from admin_roles
        where user_id = auth.uid()
    )
);

create policy "Users can create their own transactions"
on "public"."transactions"
for insert with check (
    auth.uid() = user_id
);

create policy "Only admins can update transactions"
on "public"."transactions"
for update using (
    exists (
        select 1 from admin_roles
        where user_id = auth.uid()
    )
);

-- Accorder les droits d'accès
grant all on table "public"."transactions" to authenticated;
grant all on table "public"."transactions" to service_role;
