-- Supprimer la table si elle existe
drop table if exists "public"."transactions";

-- Créer la table avec la bonne structure
create table "public"."transactions" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    "updated_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "type" text not null check (type in ('recharge', 'purchase', 'refund')),
    "status" text not null default 'en_cours' check (status in ('en_cours', 'complete', 'echec', 'annule')),
    "amount" decimal(10,2) not null check (amount > 0),
    "description" text,
    "payment_method" text,
    "transaction_user_id" text,
    "payment_details" jsonb default '{}'::jsonb,
    constraint transactions_pkey primary key (id)
);

-- Activer RLS
alter table "public"."transactions" enable row level security;

-- Créer les politiques
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

-- Créer l'index
create index if not exists idx_transactions_user_id
on "public"."transactions" (transaction_user_id);

-- Accorder les droits
grant all on table "public"."transactions" to authenticated;
grant all on table "public"."transactions" to service_role;
