-- Ajouter le champ transaction_user_id
alter table "public"."transactions"
add column if not exists "transaction_user_id" text;

-- Créer un index pour accélérer les recherches par transaction_user_id
create index if not exists idx_transactions_user_id
on "public"."transactions" (transaction_user_id);
