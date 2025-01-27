-- Supprimer la table si elle existe déjà
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

-- Insérer l'admin initial (remplacez l'ID par votre ID d'utilisateur)
insert into "public"."admin_roles" ("user_id")
values ('d10121cc-74a9-4c81-b9de-2400127a9861')
on conflict ("user_id") do nothing;
