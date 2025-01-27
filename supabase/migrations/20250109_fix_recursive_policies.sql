-- Désactiver RLS temporairement
alter table "public"."profiles" disable row level security;
alter table "public"."admin_roles" disable row level security;

-- Supprimer toutes les politiques existantes
drop policy if exists "enable_read_access" on "public"."profiles";
drop policy if exists "enable_update_access" on "public"."profiles";
drop policy if exists "enable_insert_access" on "public"."profiles";
drop policy if exists "enable_delete_access" on "public"."profiles";

-- Créer une vue pour éviter la récursion
create or replace view admin_users as
select user_id from admin_roles;

-- Créer une fonction pour vérifier le statut admin
create or replace function is_admin(user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from admin_users
    where user_id = user_uuid
  );
end;
$$ language plpgsql security definer;

-- Politique de lecture
create policy "enable_read_access" on "public"."profiles"
for select using (
  is_admin(auth.uid()) or auth.uid() = id
);

-- Politique de mise à jour
create policy "enable_update_access" on "public"."profiles"
for update using (
  is_admin(auth.uid())
);

-- Politique d'insertion
create policy "enable_insert_access" on "public"."profiles"
for insert with check (
  is_admin(auth.uid())
);

-- Politique de suppression
create policy "enable_delete_access" on "public"."profiles"
for delete using (
  is_admin(auth.uid())
);

-- Politiques pour admin_roles
create policy "enable_admin_roles_read" on "public"."admin_roles"
for select using (true);

create policy "enable_admin_roles_insert" on "public"."admin_roles"
for insert with check (
  is_admin(auth.uid())
);

create policy "enable_admin_roles_delete" on "public"."admin_roles"
for delete using (
  is_admin(auth.uid())
);

-- Réactiver RLS
alter table "public"."profiles" enable row level security;
alter table "public"."admin_roles" enable row level security;

-- Vérifier que RLS est activé
select relname, relrowsecurity 
from pg_class 
where relname in ('profiles', 'admin_roles');
