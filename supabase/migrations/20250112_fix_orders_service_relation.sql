-- Supprimer les anciennes contraintes de clé étrangère s'il y en a
alter table "public"."orders" drop constraint if exists "orders_service_id_fkey";
alter table "public"."orders" drop constraint if exists "orders_service_id_fkey1";

-- Supprimer temporairement la contrainte de clé étrangère de order_items
alter table "public"."order_items" drop constraint if exists "order_items_order_id_fkey";

-- Sauvegarder les données existantes
create temporary table temp_orders as
select distinct on (id) *
from "public"."orders"
order by id, created_at desc;

create temporary table temp_order_items as
select * from "public"."order_items";

-- Vider les tables dans le bon ordre
truncate table "public"."order_items";
truncate table "public"."orders";

-- Restaurer les données
insert into "public"."orders"
select * from temp_orders;

insert into "public"."order_items"
select * from temp_order_items;

-- Supprimer les tables temporaires
drop table temp_orders;
drop table temp_order_items;

-- Recréer la contrainte de clé étrangère pour order_items
alter table "public"."order_items" 
    add constraint "order_items_order_id_fkey" 
    foreign key (order_id) 
    references "public"."orders"(id) 
    on delete cascade;

-- Ajouter la nouvelle contrainte de clé étrangère pour service_id
alter table "public"."orders" 
    add constraint "orders_service_id_fkey" 
    foreign key ("service_id") 
    references "public"."services"("id") 
    on delete set null;

-- Créer un index pour améliorer les performances des jointures
create index if not exists "orders_service_id_idx" 
    on "public"."orders" ("service_id");
