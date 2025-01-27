-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the required tables if they don't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    CONSTRAINT buckets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    bucket_id text,
    name text,
    owner uuid DEFAULT auth.uid(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT objects_pkey PRIMARY KEY (id),
    CONSTRAINT objects_buckets_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, owner, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    auth.uid(),
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Bucket Access" ON storage.buckets;
DROP POLICY IF EXISTS "Admin Bucket Access" ON storage.buckets;

-- Create simplified policies
CREATE POLICY "Give users access to own folder"
ON storage.objects FOR ALL USING (
    auth.role() = 'authenticated'
    AND (
        bucket_id = 'images'
        AND (
            auth.uid() = owner
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    )
);

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Bucket policies
CREATE POLICY "Allow public bucket read access"
ON storage.buckets FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated bucket access"
ON storage.buckets FOR ALL
USING (
    auth.role() = 'authenticated'
    AND (
        owner = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
);
