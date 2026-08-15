-- Script to create public 'gallery-images' bucket for Merdeka 81

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;


-- 3. Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;

-- 4. Create Policies for 'gallery-images'
-- ALLOW SELECT: Everyone can view images
CREATE POLICY "Public View Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'gallery-images');

-- ALLOW INSERT: Authenticated users (and anon if you allow public uploads, here we use true for simplicity to avoid Auth token issues during rush)
CREATE POLICY "Public Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'gallery-images');

-- ALLOW UPDATE
CREATE POLICY "Public Update Access" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'gallery-images');

-- ALLOW DELETE
CREATE POLICY "Public Delete Access" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'gallery-images');
