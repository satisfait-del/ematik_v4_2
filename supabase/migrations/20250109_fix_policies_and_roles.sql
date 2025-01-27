-- Désactiver RLS temporairement
alter table "public"."profiles" disable row level security;

-- Supprimer les politiques existantes qui dépendent de admin_roles
drop policy if exists "enable_read_access" on "public"."profiles";
drop policy if exists "enable_update_access" on "public"."profiles";

-- Maintenant on peut supprimer et recréer la table admin_roles
drop table if exists "public"."admin_roles";

-- Créer la table admin_roles
create table "public"."admin_roles" (
    "user_id" uuid not null,
    "created_at" timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint "admin_roles_pkey" primary key ("user_id"),
    constraint "admin_roles_user_id_fkey" foreign key ("user_id") references "auth"."users"("id") on delete cascade
);

-- Accorder les droits d'accès
grant all on table "public"."admin_roles" to "authenticated";
grant all on table "public"."admin_roles" to "service_role";

-- Insérer l'admin initial
insert into "public"."admin_roles" ("user_id")
values ('d10121cc-74a9-4c81-b9de-2400127a9861')
on conflict ("user_id") do nothing;

-- Recréer les politiques pour profiles
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

-- Vérifier que la table a RLS activé
select relname, relrowsecurity 
from pg_class 
where oid = '"public"."profiles"'::regclass;
