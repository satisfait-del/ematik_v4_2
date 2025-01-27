-- Créer le bucket services s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('services', 'services', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Services images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete service images" ON storage.objects;

-- Autoriser l'accès public aux images
CREATE POLICY "Services images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'services');

-- Autoriser les utilisateurs authentifiés à uploader des images
CREATE POLICY "Users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'services');

-- Autoriser les admins à supprimer les images
CREATE POLICY "Admins can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'services'
    AND EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
    )
);
