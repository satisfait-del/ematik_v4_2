-- Drop and recreate the tips table to ensure schema is fresh
DROP TABLE IF EXISTS public.tips;

CREATE TABLE public.tips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    links JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tips;
DROP POLICY IF EXISTS "Enable insert for authenticated admin users only" ON public.tips;
DROP POLICY IF EXISTS "Enable update for authenticated admin users only" ON public.tips;
DROP POLICY IF EXISTS "Enable delete for authenticated admin users only" ON public.tips;

-- Create policies
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
