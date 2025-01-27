-- Create tips table
CREATE TABLE IF NOT EXISTS tips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    read_time VARCHAR(20) NOT NULL,
    links TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_tips_updated_at'
    ) THEN
        CREATE TRIGGER update_tips_updated_at
            BEFORE UPDATE ON tips
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Insert sample data
INSERT INTO tips (title, excerpt, content, image_url, category, read_time, links) VALUES
(
    'Comment maximiser vos résultats',
    'Découvrez les meilleures pratiques pour obtenir des résultats optimaux...',
    E'Les réseaux sociaux sont devenus un outil indispensable pour toute entreprise souhaitant développer sa présence en ligne. Voici quelques conseils pour maximiser vos résultats :\n\n1. Définissez vos objectifs\n- Identifiez clairement ce que vous souhaitez accomplir\n- Établissez des KPIs mesurables\n- Fixez des délais réalistes\n\n2. Connaissez votre audience\n- Analysez les données démographiques\n- Étudiez les comportements de vos followers\n- Adaptez votre contenu en conséquence\n\n3. Créez du contenu de qualité\n- Privilégiez la qualité à la quantité\n- Variez les formats (images, vidéos, textes)\n- Restez cohérent avec votre image de marque\n\n4. Engagez votre communauté\n- Répondez aux commentaires\n- Créez des sondages et des quiz\n- Organisez des concours\n\n5. Analysez et optimisez\n- Suivez vos statistiques régulièrement\n- Testez différentes approches\n- Ajustez votre stratégie selon les résultats',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3',
    'Guide',
    '5 min',
    'https://example.com/guide-complet'
),
(
    'Les tendances à suivre en 2024',
    'Restez à jour avec les dernières tendances du marché...',
    E'L''année 2024 apporte son lot de nouvelles tendances dans le marketing digital. Voici les principales tendances à surveiller :\n\n1. Intelligence Artificielle\n- Chatbots personnalisés\n- Analyse prédictive\n- Automatisation du marketing\n\n2. Vidéos courtes\n- TikTok et Reels\n- Contenus verticaux\n- Storytelling visuel\n\n3. Marketing d''influence\n- Micro-influenceurs\n- Contenu authentique\n- Partenariats long terme\n\n4. Durabilité et responsabilité\n- Communication éco-responsable\n- Valeurs de marque\n- Impact social\n\n5. Personnalisation\n- Expérience client unique\n- Contenu adaptatif\n- Communication ciblée',
    'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?ixlib=rb-4.0.3',
    'Tendances',
    '3 min',
    NULL
);
