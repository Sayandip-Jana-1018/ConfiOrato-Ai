-- SQL script to set up proper Supabase storage policies for the 'user' bucket

-- 1. First, ensure the 'user' bucket exists (this is already created in your Supabase project)

-- 2. Set up a policy to allow authenticated users to upload files to the 'user' bucket
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user');

-- 3. Set up a policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Set up a policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Set up a policy to allow public access to read files from the 'user' bucket
CREATE POLICY "Allow public access to user bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user');

-- Note: You can run these SQL commands in the Supabase SQL Editor
-- Go to your Supabase dashboard -> SQL Editor -> New query
-- Paste these commands and run them
