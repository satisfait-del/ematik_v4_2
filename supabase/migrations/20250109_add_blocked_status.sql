-- Ajouter la colonne is_blocked à la table profiles
alter table "public"."profiles" 
add column if not exists "is_blocked" boolean default false;

-- Mettre à jour les enregistrements existants
update "public"."profiles"
set "is_blocked" = false
where "is_blocked" is null;

-- Ajouter une contrainte not null
alter table "public"."profiles" 
alter column "is_blocked" set not null;
