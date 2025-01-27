-- Créer un type pour les types de transaction
create type transaction_type as enum ('recharge', 'purchase', 'refund');

-- Créer un type pour les statuts de transaction
create type transaction_status as enum ('en_cours', 'complete', 'echec', 'annule');

-- Créer la table transactions
create table "public"."transactions" (
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

-- Activer RLS
alter table "public"."transactions" enable row level security;

-- Politique de lecture pour l'utilisateur
create policy "Users can view their own transactions"
on "public"."transactions"
for select using (
    auth.uid() = user_id
    or exists (
        select 1 from admin_roles
        where user_id = auth.uid()
    )
);

-- Politique d'insertion pour l'utilisateur
create policy "Users can create their own transactions"
on "public"."transactions"
for insert with check (
    auth.uid() = user_id
);

-- Politique de mise à jour pour les admins
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
