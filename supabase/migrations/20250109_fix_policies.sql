-- Désactiver temporairement RLS
alter table "public"."profiles" disable row level security;

-- Supprimer toutes les politiques existantes
drop policy if exists "all_can_view_profiles" on "public"."profiles";
drop policy if exists "admins_can_view_all_profiles" on "public"."profiles";
drop policy if exists "users_can_view_own_profile" on "public"."profiles";

-- Créer une nouvelle politique pour la lecture
create policy "enable_read_access" on "public"."profiles"
for select using (
  -- Les admins peuvent tout voir
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
  -- Les utilisateurs peuvent voir leur propre profil
  or auth.uid() = id
);

-- Créer une politique pour la mise à jour
create policy "enable_update_access" on "public"."profiles"
for update using (
  -- Seuls les admins peuvent mettre à jour
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Réactiver RLS
alter table "public"."profiles" enable row level security;

-- Vérifier que la table a RLS activé
select relname, relrowsecurity 
from pg_class 
where oid = '"public"."profiles"'::regclass;
