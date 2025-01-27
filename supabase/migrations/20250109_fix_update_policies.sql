-- Désactiver RLS temporairement
alter table "public"."profiles" disable row level security;

-- Supprimer toutes les politiques existantes
drop policy if exists "enable_read_access" on "public"."profiles";
drop policy if exists "enable_update_access" on "public"."profiles";
drop policy if exists "enable_insert_access" on "public"."profiles";
drop policy if exists "enable_delete_access" on "public"."profiles";

-- Créer une politique de lecture
create policy "enable_read_access" on "public"."profiles"
for select using (
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
  or auth.uid() = id
);

-- Créer une politique de mise à jour pour les admins uniquement
create policy "enable_update_access" on "public"."profiles"
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

-- Créer une politique d'insertion pour les admins uniquement
create policy "enable_insert_access" on "public"."profiles"
for insert with check (
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
);

-- Créer une politique de suppression pour les admins uniquement
create policy "enable_delete_access" on "public"."profiles"
for delete using (
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
);

-- Réactiver RLS
alter table "public"."profiles" enable row level security;

-- Vérifier que RLS est activé
select relname, relrowsecurity 
from pg_class 
where oid = '"public"."profiles"'::regclass;
