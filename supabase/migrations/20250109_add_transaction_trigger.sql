-- Supprimer le trigger s'il existe déjà
drop trigger if exists prevent_duplicate_transaction_update on transactions;

-- Créer la fonction du trigger
create or replace function prevent_duplicate_transaction_update()
returns trigger as $$
begin
    -- Si le statut change de 'en_cours' à 'reussi'
    if OLD.status = 'en_cours' and NEW.status = 'reussi' then
        -- Vérifier si la transaction a déjà été traitée
        if exists (
            select 1
            from transactions
            where id = NEW.id
            and status = 'reussi'
        ) then
            raise exception 'Cette transaction a déjà été traitée';
        end if;
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Créer le trigger
create trigger prevent_duplicate_transaction_update
before update on transactions
for each row
execute function prevent_duplicate_transaction_update();

-- Mettre à jour les types d'énumération pour inclure tous les statuts
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'transaction_status') then
        create type transaction_status as enum ('en_cours', 'reussi', 'echec');
    end if;
end $$;

-- Ajouter la colonne status avec le nouveau type si elle n'existe pas
do $$ 
begin
    if not exists (select 1 from information_schema.columns 
                  where table_schema = 'public' 
                  and table_name = 'transactions'
                  and column_name = 'status') then
        alter table transactions add column status transaction_status default 'en_cours';
    end if;
end $$;
