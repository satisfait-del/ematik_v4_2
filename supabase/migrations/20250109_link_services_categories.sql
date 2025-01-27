-- Ajouter les colonnes pour lier les services aux catégories
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Ajouter les nouvelles colonnes à la table services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS input_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS input_placeholder TEXT,
ADD COLUMN IF NOT EXISTS required_fields JSONB DEFAULT '[]'::jsonb;

-- Ajouter une contrainte pour le type d'entrée
ALTER TABLE public.services
ADD CONSTRAINT valid_input_type 
CHECK (input_type IN ('text', 'email', 'username', 'link', 'number', 'phone'));

-- Créer un index sur category_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);

-- Créer une fonction pour le trigger qui vérifie la validité de la sous-catégorie
CREATE OR REPLACE FUNCTION check_service_subcategory()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la sous-catégorie est NULL, on accepte
    IF NEW.subcategory IS NULL THEN
        RETURN NEW;
    END IF;

    -- Si la catégorie est NULL mais la sous-catégorie ne l'est pas, on refuse
    IF NEW.category_id IS NULL THEN
        RAISE EXCEPTION 'Une sous-catégorie ne peut pas être définie sans catégorie';
    END IF;

    -- Vérifier que la sous-catégorie existe dans le tableau de la catégorie
    IF NOT EXISTS (
        SELECT 1
        FROM public.categories
        WHERE id = NEW.category_id
        AND NEW.subcategory = ANY(subcategories)
    ) THEN
        RAISE EXCEPTION 'La sous-catégorie "%" n''existe pas dans la catégorie sélectionnée', NEW.subcategory;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS check_service_subcategory_trigger ON public.services;
CREATE TRIGGER check_service_subcategory_trigger
    BEFORE INSERT OR UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION check_service_subcategory();

-- Mettre à jour les politiques RLS pour les services
DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;
DROP POLICY IF EXISTS "Enable insert for authenticated admin users only" ON public.services;
DROP POLICY IF EXISTS "Enable update for authenticated admin users only" ON public.services;
DROP POLICY IF EXISTS "Enable delete for authenticated admin users only" ON public.services;

-- Activer RLS sur la table services si ce n'est pas déjà fait
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques
CREATE POLICY "Enable read access for all users" ON public.services
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated admin users only" ON public.services
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable update for authenticated admin users only" ON public.services
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for authenticated admin users only" ON public.services
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Créer une fonction pour vérifier si une sous-catégorie est valide pour une catégorie
CREATE OR REPLACE FUNCTION public.is_valid_subcategory(
    p_category_id UUID,
    p_subcategory TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.categories
        WHERE id = p_category_id
        AND p_subcategory = ANY(subcategories)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
