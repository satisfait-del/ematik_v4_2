-- Force a complete schema refresh
DO $$
BEGIN
    -- Drop and recreate the tips table view to force schema refresh
    DROP VIEW IF EXISTS tips_view;
    CREATE VIEW tips_view AS
    SELECT 
        id,
        title,
        content,
        category,
        image_url,
        links,
        created_at,
        updated_at
    FROM public.tips;

    -- Force PostgREST to reload its schema cache
    NOTIFY pgrst, 'reload schema';
END $$;

-- Wait for cache to refresh
SELECT pg_sleep(2);

-- Verify the view exists
SELECT EXISTS (
    SELECT FROM pg_views
    WHERE schemaname = 'public'
    AND viewname = 'tips_view'
) as view_exists;
