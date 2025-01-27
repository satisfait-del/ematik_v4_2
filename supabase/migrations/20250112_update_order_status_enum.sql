-- Modifier l'enum order_status pour ajouter les nouvelles valeurs
-- Créer un nouveau type enum avec les nouvelles valeurs
CREATE TYPE order_status_new AS ENUM ('en_cours', 'traite', 'non_traite');

-- Supprimer la valeur par défaut temporairement
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;

-- Convertir la colonne vers le type text
ALTER TABLE orders 
  ALTER COLUMN status TYPE text;

-- Remettre la valeur par défaut
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'en_cours';

-- Supprimer l'ancien type
DROP TYPE IF EXISTS order_status;

-- Renommer le nouveau type
ALTER TYPE order_status_new RENAME TO order_status;

-- Mettre à jour la contrainte de vérification sur la colonne status de la table transactions
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('en_cours', 'reussi', 'complete', 'echec', 'annule'));

-- Supprimer tous les triggers existants sur la table orders
DO $$ 
DECLARE
    trigger_name text;
BEGIN
    FOR trigger_name IN (
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'orders'::regclass
    )
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON orders';
    END LOOP;
END $$;

-- Supprimer toutes les fonctions de trigger existantes liées aux transactions
DROP FUNCTION IF EXISTS create_transaction CASCADE;
DROP FUNCTION IF EXISTS set_transaction_status CASCADE;
DROP FUNCTION IF EXISTS handle_new_order CASCADE;
DROP FUNCTION IF EXISTS update_profile_total_spent CASCADE;

-- Créer ou remplacer la fonction du trigger pour les commandes
CREATE OR REPLACE FUNCTION handle_new_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer la transaction avec le statut complete car le solde a déjà été vérifié et déduit
    INSERT INTO transactions (
        user_id,
        order_id,
        type,
        amount,
        status,
        description
    ) VALUES (
        NEW.user_id,
        NEW.id,
        'achat',
        NEW.total_amount,
        'complete',
        'Achat de service'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le nouveau trigger pour les commandes
CREATE TRIGGER handle_new_order_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_new_order();

-- Créer ou remplacer la fonction pour mettre à jour le total dépensé
CREATE OR REPLACE FUNCTION update_profile_total_spent()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.status = 'complete') THEN
        -- When a new completed transaction is created
        UPDATE profiles 
        SET total_spent = total_spent + NEW.amount
        WHERE id = NEW.user_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If status changes to complete, add the amount
        IF (OLD.status != 'complete' AND NEW.status = 'complete') THEN
            UPDATE profiles 
            SET total_spent = total_spent + NEW.amount
            WHERE id = NEW.user_id;
        -- If status changes from complete to something else, subtract the amount
        ELSIF (OLD.status = 'complete' AND NEW.status != 'complete') THEN
            UPDATE profiles 
            SET total_spent = total_spent - NEW.amount
            WHERE id = NEW.user_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.status = 'complete') THEN
        -- When a completed transaction is deleted
        UPDATE profiles 
        SET total_spent = total_spent - OLD.amount
        WHERE id = OLD.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour le total dépensé
CREATE TRIGGER update_profile_total_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_total_spent();
