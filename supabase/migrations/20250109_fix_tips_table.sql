-- Recreate the tips table with all columns
CREATE TABLE IF NOT EXISTS public.tips_new (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Copy data from old table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tips') THEN
        INSERT INTO public.tips_new (id, title, content, category, links, created_at, updated_at)
        SELECT id, title, content, category, COALESCE(links, '[]'::jsonb), created_at, updated_at
        FROM public.tips;
    END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS public.tips;
ALTER TABLE public.tips_new RENAME TO tips;

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Recreate policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tips;
DROP POLICY IF EXISTS "Enable insert for authenticated admin users only" ON public.tips;
DROP POLICY IF EXISTS "Enable update for authenticated admin users only" ON public.tips;
DROP POLICY IF EXISTS "Enable delete for authenticated admin users only" ON public.tips;

CREATE POLICY "Enable read access for all users" ON public.tips
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated admin users only" ON public.tips
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable update for authenticated admin users only" ON public.tips
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for authenticated admin users only" ON public.tips
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_tips_updated_at ON public.tips;
CREATE TRIGGER update_tips_updated_at
    BEFORE UPDATE ON public.tips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Force refresh of PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tips' 
        AND column_name = 'image_url'
    ) THEN
        RAISE EXCEPTION 'image_url column does not exist in tips table';
    END IF;
END $$;
