-- Ajouter la colonne image_url à la table services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS image_url TEXT;
