-- Ajouter la colonne telephone si elle n'existe pas
do $$ 
begin
    if not exists (select 1 from information_schema.columns 
                  where table_schema = 'public' 
                  and table_name = 'transactions'
                  and column_name = 'telephone') then
        alter table "public"."transactions" 
        add column "telephone" text;
    end if;
end $$;
