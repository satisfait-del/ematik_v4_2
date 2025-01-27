-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add image_url column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tips' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.tips ADD COLUMN image_url TEXT;
    END IF;

    -- Add links column
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tips' 
        AND column_name = 'links'
    ) THEN
        ALTER TABLE public.tips ADD COLUMN links JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Force refresh of PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- Wait a moment to ensure the schema cache is refreshed
SELECT pg_sleep(1);

-- Verify the columns exist and are accessible
SELECT 
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tips' 
        AND column_name = 'image_url'
    ) as image_url_exists,
    EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tips' 
        AND column_name = 'links'
    ) as links_exists;
