-- Enable RLS for categories if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public' 
        AND tablename = 'categories'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable insert for authenticated admin users only" ON public.categories;
DROP POLICY IF EXISTS "Enable update for authenticated admin users only" ON public.categories;
DROP POLICY IF EXISTS "Enable delete for authenticated admin users only" ON public.categories;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated admin users only" ON public.categories
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Enable update for authenticated admin users only" ON public.categories
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for authenticated admin users only" ON public.categories
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
