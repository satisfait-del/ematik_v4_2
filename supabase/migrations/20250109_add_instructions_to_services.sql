-- Add instructions column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add subcategory column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Create duration_type enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'duration_type') THEN
        CREATE TYPE duration_type AS ENUM ('days', 'months', 'years', 'lifetime');
    END IF;
END $$;

-- Drop existing duration columns if they exist with NOT NULL constraint
ALTER TABLE public.services DROP COLUMN IF EXISTS duration_value;
ALTER TABLE public.services DROP COLUMN IF EXISTS duration_type;

-- Add duration columns to services table with NULL allowed
ALTER TABLE public.services ADD COLUMN duration_value INTEGER NULL;
ALTER TABLE public.services ADD COLUMN duration_type duration_type NULL;

-- Create delivery_time_type enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_time_type') THEN
        CREATE TYPE delivery_time_type AS ENUM ('minutes', 'hours', 'days');
    END IF;
END $$;

-- Drop existing delivery time columns if they exist with NOT NULL constraint
ALTER TABLE public.services DROP COLUMN IF EXISTS delivery_time_value;
ALTER TABLE public.services DROP COLUMN IF EXISTS delivery_time_type;

-- Add delivery time columns to services table with NULL allowed
ALTER TABLE public.services ADD COLUMN delivery_time_value INTEGER NULL;
ALTER TABLE public.services ADD COLUMN delivery_time_type delivery_time_type NULL;

-- Create input_type enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'input_type') THEN
        CREATE TYPE input_type AS ENUM ('text', 'number', 'email', 'tel', 'url', 'textarea');
    END IF;
END $$;

-- Drop existing input type columns if they exist
ALTER TABLE public.services DROP COLUMN IF EXISTS input_type;
ALTER TABLE public.services DROP COLUMN IF EXISTS input_placeholder;

-- Add input type columns to services table with NULL allowed
ALTER TABLE public.services ADD COLUMN input_type input_type NULL;
ALTER TABLE public.services ADD COLUMN input_placeholder TEXT NULL;
