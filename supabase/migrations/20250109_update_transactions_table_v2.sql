-- Ajouter la colonne payment_details si elle n'existe pas
do $$ 
begin
    if not exists (select 1 from information_schema.columns 
                  where table_schema = 'public' 
                  and table_name = 'transactions'
                  and column_name = 'payment_details') then
        alter table "public"."transactions" 
        add column "payment_details" jsonb default '{}'::jsonb;
    end if;
end $$;

-- Ajouter la colonne transaction_user_id si elle n'existe pas
do $$ 
begin
    if not exists (select 1 from information_schema.columns 
                  where table_schema = 'public' 
                  and table_name = 'transactions'
                  and column_name = 'transaction_user_id') then
        alter table "public"."transactions" 
        add column "transaction_user_id" text;
    end if;
end $$;

-- Créer l'index si il n'existe pas
create index if not exists idx_transactions_user_id
on "public"."transactions" (transaction_user_id);

-- Mettre à jour l'enum transaction_type si nécessaire
do $$
begin
    -- Vérifier si les valeurs existent déjà dans l'enum
    if not exists (select 1 from pg_type 
                  where typname = 'transaction_type' 
                  and typtype = 'e') then
        create type transaction_type as enum ('recharge', 'achat', 'remboursement');
    else
        -- Ajouter les nouvelles valeurs si elles n'existent pas
        begin
            alter type transaction_type add value if not exists 'recharge';
            alter type transaction_type add value if not exists 'achat';
            alter type transaction_type add value if not exists 'remboursement';
        exception when duplicate_object then
            null;
        end;
    end if;
end $$;

-- Mettre à jour l'enum transaction_status si nécessaire
do $$
begin
    -- Vérifier si les valeurs existent déjà dans l'enum
    if not exists (select 1 from pg_type 
                  where typname = 'transaction_status' 
                  and typtype = 'e') then
        create type transaction_status as enum ('en_cours', 'complete', 'echec', 'annule');
    else
        -- Ajouter les nouvelles valeurs si elles n'existent pas
        begin
            alter type transaction_status add value if not exists 'en_cours';
            alter type transaction_status add value if not exists 'complete';
            alter type transaction_status add value if not exists 'echec';
            alter type transaction_status add value if not exists 'annule';
        exception when duplicate_object then
            null;
        end;
    end if;
end $$;

-- Mettre à jour les politiques
drop policy if exists "Users can view their own transactions" on "public"."transactions";
create policy "Users can view their own transactions"
on "public"."transactions"
for select using (
    auth.uid() = user_id
    or exists (
        select 1 from admin_roles
        where user_id = auth.uid()
    )
);

drop policy if exists "Users can create their own transactions" on "public"."transactions";
create policy "Users can create their own transactions"
on "public"."transactions"
for insert with check (
    auth.uid() = user_id
);

drop policy if exists "Only admins can update transactions" on "public"."transactions";
create policy "Only admins can update transactions"
on "public"."transactions"
for update using (
    exists (
        select 1 from admin_roles
        where user_id = auth.uid()
    )
);

-- S'assurer que RLS est activé
alter table "public"."transactions" enable row level security;

-- Accorder les droits
grant all on table "public"."transactions" to authenticated;
grant all on table "public"."transactions" to service_role;
