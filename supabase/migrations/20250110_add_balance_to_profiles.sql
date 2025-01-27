-- Add balance column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'balance'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN balance INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;
