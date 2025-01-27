-- Désactiver temporairement RLS
alter table "public"."profiles" disable row level security;

-- Supprimer toutes les politiques existantes
drop policy if exists "enable_read_access" on "public"."profiles";
drop policy if exists "enable_update_access" on "public"."profiles";

-- Créer une table pour stocker les rôles d'admin (sans RLS)
create table if not exists "public"."admin_roles" (
    user_id uuid primary key references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insérer l'utilisateur actuel comme admin
insert into admin_roles (user_id)
select id from auth.users
where email = 'votre.email@example.com' -- Remplacez par votre email
on conflict (user_id) do nothing;

-- Créer une nouvelle politique pour la lecture des profils
create policy "enable_read_access" on "public"."profiles"
for select using (
  -- Les admins peuvent tout voir
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
  -- Les utilisateurs peuvent voir leur propre profil
  or auth.uid() = id
);

-- Créer une politique pour la mise à jour
create policy "enable_update_access" on "public"."profiles"
for update using (
  -- Seuls les admins peuvent mettre à jour
  exists (
    select 1 from admin_roles
    where user_id = auth.uid()
  )
);

-- Réactiver RLS
alter table "public"."profiles" enable row level security;
