-- Activer RLS sur la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Créer la politique pour permettre à un utilisateur de créer son propre profil
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Créer la politique pour permettre à un utilisateur de voir son propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Créer la politique pour permettre à un utilisateur de mettre à jour son propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Supprimer la colonne username si elle existe
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='username') 
    THEN
        ALTER TABLE profiles DROP COLUMN username;
    END IF;
END $$;

-- Supprimer la colonne email si elle existe
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='email') 
    THEN
        ALTER TABLE profiles DROP COLUMN email;
    END IF;
END $$;

-- Vérifier si la colonne full_name existe déjà
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='full_name') 
    THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Créer la table onboarding_data si elle n'existe pas
CREATE TABLE IF NOT EXISTS onboarding_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    step_completed INTEGER DEFAULT 0,
    user_type TEXT,
    usage_frequency TEXT,
    preferred_services TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Activer RLS sur la table onboarding_data
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

-- Créer la politique pour permettre à un utilisateur de gérer ses propres données d'onboarding
DROP POLICY IF EXISTS "Users can manage own onboarding data" ON onboarding_data;
CREATE POLICY "Users can manage own onboarding data" ON onboarding_data
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ajouter la colonne has_completed_onboarding à la table profiles si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='has_completed_onboarding') 
    THEN
        ALTER TABLE profiles ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Créer la fonction de mise à jour si elle n'existe pas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Vérifier et créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_onboarding_data_updated_at'
    ) THEN
        CREATE TRIGGER update_onboarding_data_updated_at
            BEFORE UPDATE ON onboarding_data
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
