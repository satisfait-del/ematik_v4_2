-- Supprimer l'enum s'il existe
DROP TYPE IF EXISTS transaction_status CASCADE;

-- Supprimer toutes les contraintes existantes sur la colonne status si elle existe
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
        ALTER TABLE transactions ALTER COLUMN status DROP DEFAULT;
    END IF;
END $$;

-- Vérifier si la colonne status existe et l'ajouter si nécessaire
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'status'
    ) THEN
        -- Ajouter la colonne status
        ALTER TABLE transactions 
        ADD COLUMN status text;

        -- Définir la valeur par défaut pour les lignes existantes
        UPDATE transactions SET status = 'en_cours';

        -- Rendre la colonne NOT NULL
        ALTER TABLE transactions 
        ALTER COLUMN status SET NOT NULL;
    ELSE
        -- Si la colonne existe déjà, s'assurer qu'elle est de type text
        ALTER TABLE transactions ALTER COLUMN status TYPE text;

        -- Mettre à jour les valeurs existantes pour assurer la cohérence
        UPDATE transactions 
        SET status = CASE status
            WHEN 'completed' THEN 'complete'
            WHEN 'succeeded' THEN 'reussi'
            WHEN 'failed' THEN 'echec'
            WHEN 'cancelled' THEN 'annule'
            ELSE status
        END;
    END IF;
END $$;

-- Ajouter la nouvelle contrainte check
ALTER TABLE transactions 
ADD CONSTRAINT transactions_status_check 
CHECK (status IN ('en_cours', 'reussi', 'complete', 'echec', 'annule'));

-- Remettre la valeur par défaut
ALTER TABLE transactions 
ALTER COLUMN status SET DEFAULT 'en_cours';
