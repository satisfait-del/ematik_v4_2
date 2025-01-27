-- Désactiver RLS temporairement pour la table orders
alter table "public"."orders" disable row level security;

-- Supprimer les politiques existantes
drop policy if exists "enable_read_access" on "public"."orders";
drop policy if exists "enable_update_access" on "public"."orders";
drop policy if exists "enable_insert_access" on "public"."orders";
drop policy if exists "enable_delete_access" on "public"."orders";

-- Créer une politique de lecture pour les admins et les propriétaires
create policy "enable_read_access" on "public"."orders"
for select using (
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
  or user_id = auth.uid()
);

-- Créer une politique de mise à jour pour les admins uniquement
create policy "enable_update_access" on "public"."orders"
for update using (
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
);

-- Créer une politique d'insertion pour les utilisateurs authentifiés
create policy "enable_insert_access" on "public"."orders"
for insert with check (
  auth.role() = 'authenticated'
);

-- Réactiver RLS
alter table "public"."orders" enable row level security;

-- Vérifier que RLS est activé
select relname, relrowsecurity 
from pg_class 
where oid = '"public"."orders"'::regclass;
