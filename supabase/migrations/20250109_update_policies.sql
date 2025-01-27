-- Désactiver RLS temporairement
alter table "public"."profiles" disable row level security;

-- Supprimer les politiques existantes
drop policy if exists "all_can_view_profiles" on "public"."profiles";
drop policy if exists "admins_can_view_all_profiles" on "public"."profiles";
drop policy if exists "users_can_view_own_profile" on "public"."profiles";

-- Créer une nouvelle politique pour permettre aux utilisateurs de voir leur propre profil
create policy "users_can_view_own_profile" on "public"."profiles"
for select using (
  auth.uid() = id
);

-- Créer une nouvelle politique pour permettre aux admins de voir tous les profils
create policy "admins_can_view_all_profiles" on "public"."profiles"
for select using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Réactiver RLS
alter table "public"."profiles" enable row level security;
